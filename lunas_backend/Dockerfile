# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Render readable labels on synthetic local QA evidence images.
RUN apk add --no-cache font-dejavu

# Copy package files
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY --chown=node:node . .

# Create logs directory
RUN mkdir -p logs && chown -R node:node /app

USER node

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health/ready',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start application
CMD ["npm", "start"]
