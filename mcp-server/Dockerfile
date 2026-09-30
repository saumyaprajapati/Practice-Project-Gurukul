# Gurukul MCP server. Build:  docker build -t gurukul-mcp .
# Run:  docker run -p 8000:8000 --env-file .env -e HOST=0.0.0.0 gurukul-mcp
FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:0.12 /uv /usr/local/bin/uv
WORKDIR /app

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000
CMD ["uv", "run", "--no-dev", "gurukul-mcp"]
