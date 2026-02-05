import { eq } from 'drizzle-orm';

import { db } from './src/server/db';
import { documentEmbeddings } from './src/server/db/schema';

import 'dotenv/config';

async function testEmbeddings() {
  try {
    console.log('🔍 Verificando embeddings en la BD...\n');

    // Contar embeddings
    const embeddingsCount = await db
      .select()
      .from(documentEmbeddings)
      .where(eq(documentEmbeddings.courseId, 577));

    console.log(
      `📊 Total embeddings para curso 577: ${embeddingsCount.length}`
    );

    if (embeddingsCount.length > 0) {
      console.log('\n📄 Primeros 3 documentos:');
      embeddingsCount.slice(0, 3).forEach((doc) => {
        console.log(`
  - ID: ${doc.id}
    Source: ${doc.source}
    ChunkIndex: ${doc.chunkIndex}
    Content: ${doc.content.substring(0, 150)}...
    Embedding dims: ${doc.embedding ? (doc.embedding as number[]).length : 0}
        `);
      });
    } else {
      console.log('⚠️ No hay embeddings para el curso 577');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmbeddings();
