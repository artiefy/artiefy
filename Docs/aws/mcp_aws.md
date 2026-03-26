Title: Welcome to Open Source MCP Servers for AWS

URL Source: https://awslabs.github.io/mcp/

Published Time: Tue, 24 Mar 2026 09:05:58 GMT

Markdown Content:
Get started with open source MCP Servers for AWS and learn core features.

Open source MCP servers for AWS are a suite of specialized MCP servers that help you get the most out of AWS, wherever you use MCP.

## What is the Model Context Protocol (MCP) and how does it work with MCP servers for AWS?[​](https://awslabs.github.io/mcp/#what-is-the-model-context-protocol-mcp-and-how-does-it-work-with-mcp-servers-for-aws 'Direct link to What is the Model Context Protocol (MCP) and how does it work with MCP servers for AWS?')

> The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.
>
> — [Model Context Protocol README](https://github.com/modelcontextprotocol#:~:text=The%20Model%20Context,context%20they%20need.)

An MCP Server is a lightweight program that exposes specific capabilities through the standardized Model Context Protocol. Host applications (such as chatbots, IDEs, and other AI tools) have MCP clients that maintain 1:1 connections with MCP servers. Common MCP clients include agentic AI coding assistants (like Kiro, Cline, Cursor, Windsurf) as well as chatbot applications like Claude Desktop, with more clients coming soon. MCP servers can access local data sources and remote services to provide additional context that improves the generated outputs from the models.

MCP Servers for AWS use this protocol to provide AI applications access to AWS documentation, contextual guidance, and best practices. Through the standardized MCP client-server architecture, AWS capabilities become an intelligent extension of your development environment or AI application.

MCP Servers for AWS enable enhanced cloud-native development, infrastructure management, and development workflows—making AI-assisted cloud computing more accessible and efficient.

The Model Context Protocol is an open source project run by Anthropic, PBC. and open to contributions from the entire community. For more information on MCP, you can find further documentation [here](https://modelcontextprotocol.io/introduction)

## Why MCP Servers for AWS?[​](https://awslabs.github.io/mcp/#why-mcp-servers-for-aws 'Direct link to Why MCP Servers for AWS?')

MCP servers enhance the capabilities of foundation models (FMs) in several key ways:

- **Improved Output Quality**: By providing relevant information directly in the model's context, MCP servers significantly improve model responses for specialized domains like AWS services. This approach reduces hallucinations, provides more accurate technical details, enables more precise code generation, and ensures recommendations align with current AWS best practices and service capabilities.

- **Access to Latest Documentation**: FMs may not have knowledge of recent releases, APIs, or SDKs. MCP servers bridge this gap by pulling in up-to-date documentation, ensuring your AI assistant always works with the latest AWS capabilities.

- **Workflow Automation**: MCP servers convert common workflows into tools that foundation models can use directly. Whether it's CDK, Terraform, or other AWS-specific workflows, these tools enable AI assistants to perform complex tasks with greater accuracy and efficiency.

- **Specialized Domain Knowledge**: MCP servers provide deep, contextual knowledge about AWS services that might not be fully represented in foundation models' training data, enabling more accurate and helpful responses for cloud development tasks.

## Getting Started Essentials[​](https://awslabs.github.io/mcp/#getting-started-essentials 'Direct link to Getting Started Essentials')

New from AWS re:Invent 2025!

Essential MCP servers for AWS resource management

Before diving into specific AWS services, set up these fundamental MCP servers for working with AWS resources:

[Start here for secure, auditable AWS interactions! This remote, managed MCP server is hosted by AWS and combines comprehensive AWS API support with access to the latest AWS documentation, API references, What's New posts, and Getting Started information. Features pre-built Agent SOPs that follow AWS best practices, helping agents complete complex multi-step AWS tasks reliably. Built with safety and control in mind: syntactically validated API calls, IAM-based permissions with zero credential exposure, and complete CloudTrail audit logging. Access all AWS services for managing infrastructure, exploring resources, and executing AWS operations with full transparency and traceability. [![Image 1: Install on Kiro](https://img.shields.io/badge/Install-Kiro-9046FF?style=flat-square&logo=kiro)](https://kiro.dev/launch/mcp/add?name=aws-mcp&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mcp-proxy-for-aws%40latest%22%2C%22https%3A//aws-mcp.us-east-1.api.aws/mcp%22%5D%7D)[![Image 2: Install on Cursor](https://img.shields.io/badge/Install-Cursor-blue?style=flat-square&logo=cursor)](https://cursor.com/en-US/install-mcp?name=aws-mcp&config=eyJjb21tYW5kIjoidXZ4IG1jcC1wcm94eS1mb3ItYXdzQGxhdGVzdCBodHRwczovL2F3cy1tY3AudXMtZWFzdC0xLmFwaS5hd3MvbWNwIn0%3D)[![Image 3: Install on VS Code](https://img.shields.io/badge/Install-VS_Code-FF9900?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=AWS%20MCP%20Server&config=%7B%22command%22%3A%22uvx%22%2C%22args%22%3A%5B%22mcp-proxy-for-aws%40latest%22%2C%22https%3A%2F%2Faws-mcp.us-east-1.api.aws%2Fmcp%22%5D%7D)](https://docs.aws.amazon.com/aws-mcp/latest/userguide/what-is-mcp-server.html)

## Available MCP Servers for AWS[​](https://awslabs.github.io/mcp/#available-mcp-servers-for-aws 'Direct link to Available MCP Servers for AWS')

The servers are organized into these main categories:

- **🚀 Essential**: Official AWS MCP servers, fully managed by AWS
- **⚡ Core**: Flexible open-source servers for broad AWS access and task orchestration
- **📚 Documentation**: Real-time access to official AWS documentation
- **🏗️ Infrastructure & Deployment**: Build, deploy, and manage cloud infrastructure
- **🤖 AI & Machine Learning**: Enhance AI applications with knowledge retrieval and ML capabilities
- **📊 Data & Analytics**: Work with databases, caching systems, and data processing
- **🛠️ Developer Tools & Support**: Accelerate development with code analysis and testing utilities
- **📡 Integration & Messaging**: Connect systems with messaging, workflows, and location services
- **💰 Cost & Operations**: Monitor, optimize, and manage your AWS infrastructure and costs
- **🧬 Healthcare & Lifesciences**: Interact with AWS HealthAI services.

Showing 66 of 66 servers

[Distributed SQL with PostgreSQL compatibility](https://awslabs.github.io/mcp/servers/aurora-dsql-mcp-server)[MySQL database operations via RDS Data API](https://awslabs.github.io/mcp/servers/mysql-mcp-server)[PostgreSQL database operations via RDS Data API](https://awslabs.github.io/mcp/servers/postgres-mcp-server)[Allows you to build, deploy, and manage intelligent agents with advanced capabilities like memory, OAuth authentication, and gateway integrations](https://awslabs.github.io/mcp/servers/amazon-bedrock-agentcore-mcp-server)[Manage custom models in Bedrock for on-demand inference](https://awslabs.github.io/mcp/servers/aws-bedrock-custom-model-import-mcp-server)[Analyze documents, images, videos, and audio files](https://awslabs.github.io/mcp/servers/aws-bedrock-data-automation-mcp-server)[Query enterprise knowledge bases with citation support](https://awslabs.github.io/mcp/servers/bedrock-kb-retrieval-mcp-server)[Application monitoring and performance insights](https://awslabs.github.io/mcp/servers/cloudwatch-applicationsignals-mcp-server)[Metrics, Alarms, and Logs analysis and operational troubleshooting](https://awslabs.github.io/mcp/servers/cloudwatch-mcp-server)[Comprehensive data processing tools and real-time pipeline visibility across AWS Glue and Amazon EMR-EC2](https://awslabs.github.io/mcp/servers/aws-dataprocessing-mcp-server)[MongoDB-compatible document database operations](https://awslabs.github.io/mcp/servers/documentdb-mcp-server)[Complete DynamoDB operations and table management](https://awslabs.github.io/mcp/servers/dynamodb-mcp-server)[Container orchestration and ECS application deployment](https://awslabs.github.io/mcp/servers/ecs-mcp-server)[Kubernetes cluster management and application deployment](https://awslabs.github.io/mcp/servers/eks-mcp-server)[Advanced data structures and caching with Valkey](https://awslabs.github.io/mcp/servers/valkey-mcp-server)[High-speed caching operations](https://awslabs.github.io/mcp/servers/memcached-mcp-server)[Complete ElastiCache operations](https://awslabs.github.io/mcp/servers/elasticache-mcp-server)[Enterprise search and RAG enhancement](https://awslabs.github.io/mcp/servers/amazon-kendra-index-mcp-server)[Apache Cassandra-compatible operations](https://awslabs.github.io/mcp/servers/amazon-keyspaces-mcp-server)[Place search, geocoding, and route optimization](https://awslabs.github.io/mcp/servers/aws-location-mcp-server)[Message broker management for RabbitMQ and ActiveMQ](https://awslabs.github.io/mcp/servers/amazon-mq-mcp-server)[Graph database queries with openCypher and Gremlin](https://awslabs.github.io/mcp/servers/amazon-neptune-mcp-server)[AI image generation with text and color guidance](https://awslabs.github.io/mcp/servers/nova-canvas-mcp-server)[AI assistant based on knowledgebase with anonymous access](https://awslabs.github.io/mcp/servers/amazon-qbusiness-anonymous-mcp-server)[Data accessors to search through enterprise's Q index](https://awslabs.github.io/mcp/servers/amazon-qindex-mcp-server)[Provides tools to discover, explore, and query Amazon Redshift clusters and serverless workgroups](https://awslabs.github.io/mcp/servers/redshift-mcp-server)[SageMaker AI resource management and model development](https://awslabs.github.io/mcp/servers/sagemaker-ai-mcp-server)[Apache Spark Troubleshooting and code recommendation tool for real time error and workload analysis and fixes for Glue and EMR deployment models](https://awslabs.github.io/mcp/servers/sagemaker-unified-studio-spark-troubleshooting-mcp-server)[Apache Spark Upgrade tools for spark application upgrades and cluster migration for Glue and EMR deployment models](https://awslabs.github.io/mcp/servers/sagemaker-unified-studio-spark-upgrade-mcp-server)[Event-driven messaging and queue management](https://awslabs.github.io/mcp/servers/amazon-sns-sqs-mcp-server)[InfluxDB-compatible operations](https://awslabs.github.io/mcp/servers/timestream-for-influxdb-mcp-server)[Interact with AWS services and resources through AWS CLI commands.](https://awslabs.github.io/mcp/servers/aws-api-mcp-server)[AWS AppSync backend API management and operations execution](https://awslabs.github.io/mcp/servers/aws-appsync-mcp-server)[AWS Billing and Cost Management](https://awslabs.github.io/mcp/servers/billing-cost-management-mcp-server)[AWS CDK development with security compliance](https://awslabs.github.io/mcp/servers/cdk-mcp-server)[Comprehensive AWS resource management with integrated security scanning and full CRUDL operations](https://awslabs.github.io/mcp/servers/ccapi-mcp-server)[Direct CloudFormation resource management via Cloud Control API](https://awslabs.github.io/mcp/servers/cfn-mcp-server)[AWS API Activity, User or Resource analysis using CloudTrail Logs](https://awslabs.github.io/mcp/servers/cloudtrail-mcp-server)[Detailed cost analysis and reporting](https://awslabs.github.io/mcp/servers/cost-explorer-mcp-server)[Generate architecture diagrams and technical illustrations](https://awslabs.github.io/mcp/servers/aws-diagram-mcp-server)[Get latest AWS docs and APIs](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server)[Generate, run, debug and optimize lifescience workflows on AWS HealthOmics](https://awslabs.github.io/mcp/servers/aws-healthomics-mcp-server)[Comprehensive IAM user, role, group, and policy management with security best practices](https://awslabs.github.io/mcp/servers/iam-mcp-server)[AWS IoT SiteWise functionality for industrial IoT asset management, data ingestion, monitoring, and analytics](https://awslabs.github.io/mcp/servers/aws-iot-sitewise-mcp-server)[Get latest AWS docs, code samples, and other official content](https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server)[Execute Lambda functions as AI tools for private resource access](https://awslabs.github.io/mcp/servers/lambda-tool-mcp-server)[Prometheus-compatible operations](https://awslabs.github.io/mcp/servers/prometheus-mcp-server)[Secure, auditable AWS operations with API access, documentation, Agent SOPs, and CloudTrail logging.](https://docs.aws.amazon.com/aws-mcp/latest/userguide/what-is-mcp-server.html)[Manage, monitor, and optimize Amazon MSK clusters with best practices](https://awslabs.github.io/mcp/servers/aws-msk-mcp-server)[Pre-deployment cost estimation and optimization](https://awslabs.github.io/mcp/servers/aws-pricing-mcp-server)[Manage, query, and ingest S3-based tables with support for SQL, CSV-to-table conversion, and metadata discovery.](https://awslabs.github.io/mcp/servers/s3-tables-mcp-server)[Complete serverless application lifecycle with SAM CLI](https://awslabs.github.io/mcp/servers/aws-serverless-mcp-server)[Execute complex workflows and business processes](https://awslabs.github.io/mcp/servers/stepfunctions-tool-mcp-server)[Help users create and manage AWS Support cases](https://awslabs.github.io/mcp/servers/aws-support-mcp-server)[Terraform workflows with integrated security scanning](https://awslabs.github.io/mcp/servers/terraform-mcp-server)[Assess AWS environments against the Well-Architected Framework Security Pillar](https://awslabs.github.io/mcp/servers/well-architected-security-mcp-server)[Automated documentation from code analysis](https://awslabs.github.io/mcp/servers/code-doc-gen-mcp-server)[Intelligent planning and orchestration of MCP servers for AWS.](https://awslabs.github.io/mcp/servers/core-mcp-server)[Model Context Protocol (MCP) server for document parsing and content extraction](https://awslabs.github.io/mcp/servers/document-loader-mcp-server)[Local container building with ECR integration](https://awslabs.github.io/mcp/servers/finch-mcp-server)[React and modern web development guidance](https://awslabs.github.io/mcp/servers/frontend-mcp-server)[Semantic code search and repository analysis](https://awslabs.github.io/mcp/servers/git-repo-research-mcp-server)[Comprehensive medical imaging data lifecycle management with AWS HealthImaging - 21 tools for DICOM operations, datastore management, and patient data handling](https://awslabs.github.io/mcp/servers/healthimaging-mcp-server)[Perform Fast Healthcare Interoperability Resources (FHIR) interactions and manage AWS HealthLake datastores](https://awslabs.github.io/mcp/servers/healthlake-mcp-server)[Dynamic API integration through OpenAPI specifications](https://awslabs.github.io/mcp/servers/openapi-mcp-server)[Generate realistic test data for development and ML](https://awslabs.github.io/mcp/servers/syntheticdata-mcp-server)

## When to use local vs remote MCP servers?[​](https://awslabs.github.io/mcp/#when-to-use-local-vs-remote-mcp-servers 'Direct link to When to use local vs remote MCP servers?')

MCP servers for AWS can be run either locally on your development machine or remotely on the cloud. Here's when to use each approach:

### Local MCP Servers[​](https://awslabs.github.io/mcp/#local-mcp-servers 'Direct link to Local MCP Servers')

- **Development & Testing**: Perfect for local development, testing, and debugging
- **Offline Work**: Continue working when internet connectivity is limited
- **Data Privacy**: Keep sensitive data and credentials on your local machine
- **Low Latency**: Minimal network overhead for faster response times
- **Resource Control**: Direct control over server resources and configuration

### Remote MCP Servers[​](https://awslabs.github.io/mcp/#remote-mcp-servers 'Direct link to Remote MCP Servers')

- **Team Collaboration**: Share consistent server configurations across your team
- **Resource Intensive Tasks**: Offload heavy processing to dedicated cloud resources
- **Always Available**: Access your MCP servers from anywhere, any device
- **Automatic Updates**: Get the latest features and security patches automatically
- **Scalability**: Easily handle varying workloads without local resource constraints
- **Security**: Centralized security controls with IAM-based permissions and zero credential exposure
- **Governance**: Comprehensive audit logging and compliance monitoring for enterprise-grade governance

> **Note**: Some MCP servers, like the [official AWS MCP server](https://docs.aws.amazon.com/aws-mcp/latest/userguide/what-is-mcp-server.html) (in preview) and AWS Knowledge MCP, are provided as fully managed services by AWS. These AWS-managed remote servers require no setup or infrastructure management on your part - just connect and start using them.

## Workflows[​](https://awslabs.github.io/mcp/#workflows 'Direct link to Workflows')

Each server is designed for specific use cases:

- **👨‍💻 Vibe Coding & Development**: AI coding assistants helping you build faster
- **💬 Conversational Assistants**: Customer-facing chatbots and interactive Q&A systems
- **🤖 Autonomous Background Agents**: Headless automation, ETL pipelines, and operational systems

## Use Cases for the Servers[​](https://awslabs.github.io/mcp/#use-cases-for-the-servers 'Direct link to Use Cases for the Servers')

You can use the **AWS Documentation MCP Server** to help your AI assistant research and generate up-to-date code for any AWS service, like Amazon Bedrock Inline agents. Alternatively, you could use the **CDK MCP Server** or the **Terraform MCP Server** to have your AI assistant create infrastructure-as-code implementations that use the latest APIs and follow AWS best practices. With the **Cost Analysis MCP Server**, you could ask "What would be the estimated monthly cost for this CDK project before I deploy it?" or "Can you help me understand the potential AWS service expenses for this infrastructure design?" and receive detailed cost estimations and budget planning insights. The **Valkey MCP Server** enables natural language interaction with Valkey data stores, allowing AI assistants to efficiently manage data operations through a simple conversational interface.

## Additional Resources[​](https://awslabs.github.io/mcp/#additional-resources 'Direct link to Additional Resources')

- [Introducing AWS MCP Servers for code assistants](https://aws.amazon.com/blogs/machine-learning/introducing-aws-mcp-servers-for-code-assistants-part-1/)
- [Vibe coding with AWS MCP Servers | AWS Show & Tell](https://www.youtube.com/watch?v=qXGQQRMrcz0)
- [Terraform MCP Server Vibe Coding](https://youtu.be/i2nBD65md0Y)
- [How to Generate AWS Architecture Diagrams Using Amazon Q CLI and MCP](https://community.aws/content/2vPiiPiBSdRalaEax2rVDtshpf3/how-to-generate-aws-architecture-diagrams-using-amazon-q-cli-and-mcp)
- [Harness the power of MCP servers with Amazon Bedrock Agents](https://aws.amazon.com/blogs/machine-learning/harness-the-power-of-mcp-servers-with-amazon-bedrock-agents/)
- [Unlocking the power of Model Context Protocol (MCP) on AWS](https://aws.amazon.com/blogs/machine-learning/unlocking-the-power-of-model-context-protocol-mcp-on-aws/)
- [Introducing AWS Serverless MCP Server: AI-powered development for modern applications](https://aws.amazon.com/blogs/compute/introducing-aws-serverless-mcp-server-ai-powered-development-for-modern-applications/)
