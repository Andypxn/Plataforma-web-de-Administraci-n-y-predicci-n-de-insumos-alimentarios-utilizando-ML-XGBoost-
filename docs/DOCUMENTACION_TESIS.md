# DOCUMENTACIÓN DE TESIS: POS PREDICTIVO CON ML (XGBOOST)

## 1. Descripción del Proyecto
Este proyecto es un Sistema de Punto de Venta (POS) avanzado que integra un motor de Inteligencia Artificial para la predicción de inventario. El objetivo principal es optimizar el abastecimiento de insumos basándose en el historial de ventas, factores estacionales y variables externas.

## 2. Arquitectura Tecnológica
El sistema está construido bajo una arquitectura de microservicios y capas modernas:
- **Backend:** Java 17 con Spring Boot 3 (Arquitectura Controller-Service-Repository).
- **Frontend:** React con TypeScript (Tipado estricto y Hooks).
- **Base de Datos:** PostgreSQL para el almacenamiento relacional.
- **Servicio de ML:** Python 3.9+ utilizando la librería XGBoost para modelos de regresión.
- **Infraestructura:** Orquestación con Docker y Docker Compose.

## 3. Implementación de Machine Learning (XGBoost)
Se implementó un modelo **XGBRegressor** para predecir la demanda de productos. El modelo destaca por:
- **Features Analizadas:** 25 variables incluyendo día de la semana, mes, estacionalidad (sen/cos), días feriados, condiciones climáticas (lluvia, temperatura) y métricas de inventario (stock ratio, déficit).
- **Métricas de Rendimiento (Datos Reales):**
    - **Ranker R2 Score:** 0.965 (Excelente capacidad de priorización de pedidos).
    - **Regressor MAE:** ~1.03 unidades (Bajo error promedio en volumen de ventas).
- **Proceso de Entrenamiento:** El sistema cuenta con scripts automatizados en Python para la extracción de datos desde PostgreSQL, preprocesamiento con Scikit-learn y entrenamiento del modelo XGBoost.

## 4. Diferenciadores Técnicos (Para Reclutadores)
- **Data Science Real:** No es solo un CRUD; el sistema toma decisiones basadas en datos para responder "¿Qué comprar?" y "¿Cuánto comprar?".
- **Stack Senior:** Uso de Java/Spring Boot para robustez empresarial y React/TS para una UI profesional.
- **Contenerización:** Todo el entorno (BD, Backend, Frontend, ML Service) se despliega con un solo comando gracias a Docker.
- **Clean Code:** Aplicación de principios SOLID y Conventional Commits en español.

## 5. Resultados y Conclusiones
La integración de XGBoost permite reducir el desperdicio de insumos perecederos y evitar la pérdida de ventas por falta de stock (stock-out), demostrando un impacto real del Machine Learning en la eficiencia operativa de un negocio.
