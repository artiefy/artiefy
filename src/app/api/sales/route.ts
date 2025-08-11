import { type NextRequest, NextResponse } from "next/server";

interface UserMessage {
  userMessage: string;
}

interface ThreadResponse {
  id: string;
}

interface RunResponse {
  id: string;
}

interface StatusResponse {
  status: string;
}

interface MessageContent {
  text?: {
    value: string;
  };
}

interface Message {
  content: MessageContent[];
}

interface MessagesResponse {
  data: Message[];
}

export async function POST(req: NextRequest) {
  const { userMessage } = (await req.json()) as UserMessage;

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const ASSISTANT_ID = "asst_uSJJLPx3uAheBOkIOVtcCrww";

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Falta la clave de OpenAI" },
      { status: 500 },
    );
  }

  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };

  try {
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers,
    });
    const threadData = (await threadRes.json()) as ThreadResponse;
    const threadId = threadData.id;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        role: "user",
        content: userMessage,
      }),
    });

    const runRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID,
        }),
      },
    );
    const runData = (await runRes.json()) as RunResponse;
    const runId = runData.id;

    let runStatus = "queued";
    while (runStatus !== "completed" && runStatus !== "failed") {
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
        {
          method: "GET",
          headers,
        },
      );
      const statusData = (await statusRes.json()) as StatusResponse;
      runStatus = statusData.status;

      if (runStatus !== "completed") {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (runStatus === "failed") {
      return NextResponse.json(
        { error: "Error en la ejecución del asistente" },
        { status: 500 },
      );
    }

    // 5. Obtener la respuesta final
    const messagesRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        method: "GET",
        headers,
      },
    );
    const messagesData = (await messagesRes.json()) as MessagesResponse;

    const finalMessage =
      messagesData.data[0]?.content[0]?.text?.value ?? "No hubo respuesta.";

    return NextResponse.json({ result: finalMessage });
  } catch (error) {
    console.error("Error al interactuar con Artie:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado" },
      { status: 500 },
    );
  }
}
