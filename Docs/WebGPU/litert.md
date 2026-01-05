| **Note:** LiteRT Next is available in Alpha. The new APIs improve and simplify on-device hardware acceleration. For more information, see the[LiteRT Next documentation](https://ai.google.dev/edge/next/overview).

LiteRT (short for Lite Runtime), formerly known as TensorFlow Lite, is Google's high-performance runtime for on-device AI. You can find ready-to-run LiteRT models for a wide range of ML/AI tasks, or convert and run TensorFlow, PyTorch, and JAX models to the TFLite format using the AI Edge conversion and optimization tools.

## Key features

- **Optimized for on-device machine learning**: LiteRT addresses five key ODML constraints: latency (there's no round-trip to a server), privacy (no personal data leaves the device), connectivity (internet connectivity is not required), size (reduced model and binary size) and power consumption (efficient inference and a lack of network connections).

- **Multi-platform support** : Compatible with[Android](https://ai.google.dev/edge/android)and[iOS](https://ai.google.dev/edge/ios/quickstart)devices,[embedded Linux](https://ai.google.dev/edge/microcontrollers/python), and[microcontrollers](https://ai.google.dev/edge/microcontrollers/overview).

- **Multi-framework model options** : AI Edge provides tools to convert models from PyTorch and TensorFlow models into the FlatBuffers format (`.tflite`), enabling you to use a wide range of state-of-the-art models on LiteRT. You also have access to model optimization tools that can handle quantization and metadata.

- **Diverse language support**: Includes SDKs for Java/Kotlin, Swift, Objective-C, C++, and Python.

- **High performance** :[Hardware acceleration](https://ai.google.dev/edge/performance/delegates)through specialized delegates like GPU and iOS Core ML.

## Development workflow

The LiteRT development workflow involves identifying an ML/AI problem, choosing a model that solves that problem, and implementing the model on-device. The following steps walk you through the workflow and provides links to further instructions.

### 1. Identify the most suitable solution to the ML problem

LiteRT offers users a high level of flexibility and customizability when it comes to solving machine learning problems, making it a good fit for users who require a specific model or a specialized implementation. Users looking for plug-and-play solutions may prefer[MediaPipe Tasks](https://ai.google.dev/edge/mediapipe/solutions/tasks), which provides ready-made solutions for common machine learning tasks like object detection, text classification, and LLM inference.

Choose one of the following AI Edge frameworks:

- **LiteRT**: Flexible and customizable runtime that can run a wide range of models. Choose a model for your use case, convert it to the LiteRT format (if necessary), and run it on-device. If you intend to use LiteRT, keep reading.
- **MediaPipe Tasks** : Plug-and-play solutions with default models that allow for customization. Choose the task that solves your AI/ML problem, and implement it on multiple platforms. If you intend to use MediaPipe Tasks, refer to the[MediaPipe Tasks](https://ai.google.dev/edge/mediapipe/solutions/tasks)documentation.

### 2. Choose a model

A LiteRT model is represented in an efficient portable format known as[FlatBuffers](https://google.github.io/flatbuffers/), which uses the`.tflite`file extension.

You can use a LiteRT model in the following ways:

- **Use an existing LiteRT model:** The simplest approach is to use a LiteRT model already in the`.tflite`format. These models do not require any added conversion steps. You can find LiteRT models on[Kaggle Models](https://www.kaggle.com/models?framework=tfLite).

- **Convert a model into a LiteRT model:** You can use the[PyTorch Converter](https://ai.google.dev/edge/conversion/pytorch/overview)or[TensorFlow Converter](https://ai.google.dev/edge/conversion/tensorflow/overview)to convert models to the FlatBuffers format (`.tflite`) and run them in LiteRT. To get started, you can find models on the following sites:
  - **PyTorch models** on[Hugging Face](https://huggingface.co/models?library=pytorch)and[`torchvision`](https://pytorch.org/vision/stable/models.html)
  - **TensorFlow models** on[Kaggle Models](https://www.kaggle.com/models?framework=tensorFlow2)and[Hugging Face](https://huggingface.co/models?library=tf)

A LiteRT model can optionally include*metadata* that contains human-readable model descriptions and machine-readable data for automatic generation of pre- and post-processing pipelines during on-device inference. Refer to[Add metadata](https://ai.google.dev/edge/conversion/tensorflow/metadata)for more details.

### 3. Integrate the model into your app

You can implement your LiteRT models to run inferences completely on-device on web, embedded, and mobile devices. LiteRT contains APIs for[Python](https://ai.google.dev/edge/api/tflite/python/tf/lite),[Java and Kotlin](https://ai.google.dev/edge/api/tflite/java/org/tensorflow/lite/package-summary)for Android,[Swift](https://ai.google.dev/edge/api/tflite/swift/Classes)for iOS, and[C++](https://ai.google.dev/edge/api/tflite/cc)for micro-devices.

Use the following guides to implement a LiteRT model on your preferred platform:

- [Run on Android](https://ai.google.dev/edge/android/index): Run models on Android devices using the Java/Kotlin APIs.
- [Run on iOS](https://ai.google.dev/edge/ios/quickstart): Run models on iOS devices using the Swift APIs.
- [Run on Micro](https://ai.google.dev/edge/microcontrollers/overview): Run models on embedded devices using the C++ APIs.

On Android and iOS devices, you can improve performance using hardware acceleration. On either platform you can use a[GPU Delegate](https://ai.google.dev/edge/performance/gpu), and on iOS you can use the[Core ML Delegate](https://ai.google.dev/edge/ios/coreml). To add support for new hardware accelerators, you can[define your own delegate](https://ai.google.dev/edge/performance/implementing_delegate).

You can run inference in the following ways based on the model type:

- **Models without metadata** : Use the[LiteRT Interpreter](https://ai.google.dev/edge/litert/inference)API. Supported on multiple platforms and languages such as Java, Swift, C++, Objective-C and Python.

- **Models with metadata** : You can build custom inference pipelines with the[LiteRT Support Library](https://ai.google.dev/edge/android/metadata/lite_support).

## Migrate from TF Lite

Applications that use TF Lite libraries will continue to function, but all new active development and updates will only be included in LiteRT packages. The LiteRT APIs contain the same method names as the TF Lite APIs, so migrating to LiteRT does not require detailed code changes.

For more information, refer to the[migration guide](https://ai.google.dev/edge/migration).

## Next steps

New users should get started with the[LiteRT quickstart](https://ai.google.dev/edge/inference). For specific information, see the following sections:

**Model conversion**

- [Convert PyTorch models](https://ai.google.dev/edge/conversion/pytorch/overview)
- [Convert PyTorch Generative AI models](https://ai.google.dev/edge/conversion/pytorch/genai)
- [Convert TensorFlow models](https://ai.google.dev/edge/conversion/tensorflow/overview)
- [Convert JAX models](https://ai.google.dev/edge/conversion/jax/overview)

**Platform guides**

- [Run on Android](https://ai.google.dev/edge/android/index)
- [Run on iOS](https://ai.google.dev/edge/ios/quickstart)
- [Run on Micro](https://ai.google.dev/edge/microcontrollers/overview)
