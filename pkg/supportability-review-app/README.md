# Provides tools to help keep Kubernetes clusters running reliably

This extension provides the tools needed to keep Rancher and downstream Kubernetes clusters running reliably, such as scanning clusters to detect potential issues.

The **Support Assistant** extension helps proactively validate your Rancher managed Kubernetes cluster configuration and environment to ensure it's production-ready and support-aligned.

## Key Features

- **Best Practice Validation**: Verifies that your cluster design adheres to SUSE-recommended architecture for optimal supportability.
- **Support Matrix Compliance**: Checks whether your cluster meets all SUSE supportability requirements for reliable and successful operation.
- **CVE Awareness**: Alerts you to known CVEs (Common Vulnerabilities and Exposures) that may affect your cluster components.

## Requirements

The extension uses the **Supportability Review Operator** to run reviews on your clusters. After installing the extension, open **Support Assistant** from the side menu and follow the instructions to install the operator.

For more information, see the [project repository](https://github.com/rancher/supportability-review-app).
