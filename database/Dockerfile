# filename: database/Dockerfile

FROM mongo:7.0

# Create initialization directory
COPY init/ /docker-entrypoint-initdb.d/

# Expose MongoDB default port
EXPOSE 27017

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet