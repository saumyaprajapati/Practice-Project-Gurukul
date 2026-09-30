"""`uv run gurukul-mcp` (or `python -m gurukul_mcp`): serve the MCP server on HOST:PORT."""

import logging

import uvicorn

from gurukul_mcp.config import load_settings
from gurukul_mcp.server import build_app


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    config = load_settings()
    print(f"Gurukul MCP server: {config.resource_url}  (listening on {config.host}:{config.port})")
    uvicorn.run(build_app(config), host=config.host, port=config.port, log_level="info")


if __name__ == "__main__":
    main()
