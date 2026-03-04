# SmartPOS: Inventory Intelligence & ML Forecasting
> **Sistema POS de Alto Rendimiento con Motor de Predicción de Demanda basado en XGBoost.**

## Resumen del Proyecto
**SmartPOS** no es solo un software de administración; es una solución de **Logística Inteligente**. Resuelve el problema crítico de la gestión de inventarios en la industria alimentaria (aplicado específicamente a una Taquería de alto volumen), utilizando **Machine Learning** para predecir la demanda de insumos, optimizar las compras y reducir drásticamente el desperdicio operativo.

El motor predictivo está basado en el algoritmo **XGBoost**, entrenado para analizar patrones de consumo, estacionalidad y factores externos, respondiendo con precisión a: **¿Qué comprar?, ¿Cuánto comprar? y ¿A qué precio?**

---

##  Stack Tecnológico & Arquitectura

###  Core Engineering (Full-Stack)
*   **Backend:** Java 17 con **Spring Boot 3**. Implementación de **Clean Architecture** y arquitectura en capas (`Controller -> Service -> Repository`).
*   **Frontend:** **React** con **TypeScript** (estricto). Gestión de estado eficiente, hooks personalizados y servicios centralizados con **Axios**.
*   **Base de Datos:** **PostgreSQL** optimizada con índices para integridad de transacciones y auditoría de inventario en tiempo real.

###  Data Science & ML Engine
*   **Modelo:** `XGBRegressor` con un **$R^2$ Score de 0.965** en la priorización de pedidos.
*   **Feature Engineering:** El modelo procesa 25 variables críticas:
    *   **Temporales:** Ciclos seno/coseno para estacionalidad, feriados y fines de semana.
    *   **Externas:** Factores climáticos (temperatura/lluvia) y eventos locales.
    *   **Métricas de Inventario:** Ratio de stock, déficit proyectado y puntos de reorden (Reorder Point).
*   **Pipeline:** Extracción desde SQL $\rightarrow$ Preprocesamiento con Pandas/Scikit-learn $\rightarrow$ Inferencia mediante microservicio Python.

### Infraestructura (DevOps)
*   **Contenerización:** Despliegue orquestado mediante **Docker Compose**, separando los microservicios de ML, Backend y Frontend para asegurar escalabilidad independiente y aislamiento de dependencias.

---

##  Interpretabilidad del Modelo (Explainable AI)
Para asegurar que las decisiones de la IA sean confiables para el operador, el sistema integra reportes de importancia de variables. El modelo prioriza factores de estacionalidad semanal y eventos climáticos, permitiendo un ajuste de inventario con un **Error Absoluto Medio (MAE) de ~1.03 unidades**.

> *Visualizaciones detalladas disponibles en el reporte de tesis adjunto en `documents/TESIS_ML/`.*

---

##  Diferenciadores Técnicos
*   **Enfoque en ROI:** Solución orientada a reducir *stock-outs* y exceso de productos perecederos.
*   **Calidad de Código:** Uso extensivo de **DTOs**, validación con `jakarta.validation`, manejo global de excepciones y tipado estricto en toda la aplicación.
*   **Docker Ready:** Configuración lista para entornos de desarrollo y pre-producción con un solo comando.

---

##  Ejecución Rápida

```bash
# Clonar y levantar el entorno completo
git clone https://github.com/tu-usuario/smart-pos-ml.git
cd smart-pos-ml
docker-compose up --build -d
```

---

##  Sobre mí
**Ingeniero en Computación** | *ESIME Culhuacán - Instituto Politécnico Nacional (IPN)*
*   **Enfoque:** Desarrollo Full-Stack & Data Science.
*   **Idiomas:** Inglés Nivel B1 (Certificado por CENLEX Santo Tomás).
*   **Intereses:** Sistemas distribuidos, ML y finanzas personales/negocios aplicadas a tecnología.

