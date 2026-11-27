# ==============================================================================
# MAISON VÉRA v5.0 — .NET 10 Optical Rx & Atelier Backend Multi-Stage Dockerfile
# Stage 1: .NET 10 SDK restore, build & release publish
# Stage 2: Hardened non-root ASP.NET Core 10 runtime
# ==============================================================================

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder
WORKDIR /src

COPY MaisonVera.sln ./
COPY src/MaisonVera.Domain/MaisonVera.Domain.csproj src/MaisonVera.Domain/
COPY src/MaisonVera.Infrastructure/MaisonVera.Infrastructure.csproj src/MaisonVera.Infrastructure/
COPY src/MaisonVera.Api/MaisonVera.Api.csproj src/MaisonVera.Api/
COPY tests/MaisonVera.Api.Tests/MaisonVera.Api.Tests.csproj tests/MaisonVera.Api.Tests/

RUN dotnet restore MaisonVera.sln

COPY src ./src
COPY tests ./tests

RUN dotnet test MaisonVera.sln --configuration Release --no-restore
RUN dotnet publish src/MaisonVera.Api/MaisonVera.Api.csproj \
    --configuration Release \
    --no-restore \
    -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=builder /app/publish ./

USER $APP_UID
EXPOSE 8080

ENTRYPOINT ["dotnet", "MaisonVera.Api.dll"]
