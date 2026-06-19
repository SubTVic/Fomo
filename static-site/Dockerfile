# SPDX-License-Identifier: AGPL-3.0-only
#
# Self-contained image that bakes the current data into a static bundle and
# serves it with nginx. Use this for registry/air-gapped deploys. For live data
# swaps without rebuilding the image, see docker-compose.yml + scripts/update-data.sh.
#
#   docker build \
#     --build-arg NEXT_PUBLIC_UMAMI_WEBSITE_ID=xxxx \
#     -t fomo-static .
#   docker run -p 8080:80 fomo-static

# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* are inlined at build time → must be build args, not runtime env.
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
ARG NEXT_PUBLIC_UMAMI_SRC=""
ARG NEXT_PUBLIC_BASE_PATH=""
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* ./
# Use a lockfile when present (reproducible), else resolve from package.json.
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .
# Validate before building so a broken data file fails the image build.
RUN node scripts/validate-data.mjs && npm run build

# ---- serve stage ----
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html/current
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO /dev/null http://localhost/ || exit 1
