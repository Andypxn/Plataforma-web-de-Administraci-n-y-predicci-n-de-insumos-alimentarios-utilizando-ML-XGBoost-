# SmartPOS: Arquitectura y Comunicación de Microservicios

Este documento describe la interacción técnica entre los componentes del sistema para lograr una administración inteligente y predictiva.

## 🏗️ Diagrama de Arquitectura (C4 - L2)

```mermaid
graph TD
    subgraph Client_Side [Frontend - React/TS]
        UI[Dashboard / POS]
        Hook[usePredictions Hook]
    end

    subgraph Server_Side [Backend - Spring Boot 3]
        API[REST Controllers]
        Service[Business Logic Layer]
        Repo[JPA Repositories]
    end

    subgraph Data_Science_Engine [ML Prediction Service - Python]
        FastAPI[FastAPI Endpoint]
        XGBoost[XGBRegressor Model]
        Preprocessing[Feature Engineering Pipeline]
    end

    subgraph Infrastructure
        DB[(PostgreSQL Database)]
        Docker[Docker Compose Orchestration]
    end

    %% Flujo de Predicción
    UI -->|GET /api/predicciones| API
    API --> Service
    Service -->|HTTP Request| FastAPI
    FastAPI --> Preprocessing
    Preprocessing --> XGBoost
    XGBoost -->|Prediction Result| FastAPI
    FastAPI -->|JSON Response| Service
    Service -->|DTO| API
    API --> UI

    %% Flujo de Persistencia
    API --> Service
    Service --> Repo
    Repo --> DB
```

## 🧠 Flujo de Datos de Machine Learning (ML Pipeline)

1. **Extracción (ETL):** El servicio de ML extrae el historial de ventas desde PostgreSQL.
2. **Feature Engineering:**
    - Transformación de fechas a ciclos armónicos (seno/coseno).
    - Inyección de variables climáticas externas.
    - Cálculo de métricas de inventario (Stock Ratio, Reorder Point).
3. **Inferencia:** El modelo XGBRegressor calcula el volumen de compra recomendado para evitar *stock-outs*.
4. **Entrega:** La predicción se envía al backend de Java para ser consumida por el módulo de compras del POS.

## 🐳 Infraestructura de Contenedores

| Contenedor | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| `smartpos-api` | Java 17 | Lógica de negocio, seguridad y persistencia. |
| `smartpos-ui` | React 18 | Interfaz de usuario y visualización de datos. |
| `smartpos-ml` | Python 3.9 | Inferencia predictiva con XGBoost. |
| `smartpos-db` | PostgreSQL | Almacenamiento relacional de datos. |
