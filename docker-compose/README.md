<h1 align="center">Mind Map Docker Compose</h1>
<p align="center"><p align="center">
        <br>
        <a href="https://dialx.ai/">
          <img src="https://dialx.ai/dialx_logo.svg" alt="About DIALX">
        </a>
    </p>
<h4 align="center">
    <a href="https://discord.gg/ukzj9U9tEe">
        <img src="https://img.shields.io/static/v1?label=DIALX%20Community%20on&message=Discord&color=blue&logo=Discord&style=flat-square" alt="Discord">
    </a>
</h4>

---

## Overview

This Docker Compose setup allows you to run **DIAL AI** and **Mind Map** services locally.

## Prerequisites

Before starting, you need to configure **three required AI models** for the Mind Map service:

- `gpt-4.1`
- `gpt-4.1-mini`
- `gpt-5`

## Configuration

Update the `upstreams` section for each model in the following file:

./dial_dir/core/config.json

```json
Example configuration:

"upstreams": [
    {
        "endpoint": "Azure model deployment endpoint",
        "key": "YOUR_API_KEY"
    }
]
```

Make sure each required model is properly configured with a valid endpoint and API key.

## Running the services

Once the configuration is complete, start all services with:

```bash
docker compose up
```
