# Reporte Técnico 04: Despliegue Docker y MLOps - Aislamiento del Entorno Predictivo

## 1. ¿Qué paso? (Descripción Técnica)
Se configuró un entorno de ejecución aislado mediante **Docker**, utilizando la imagen base `python:3.11-slim` para optimizar el tamaño de la capa de ejecución. Se integraron bibliotecas del sistema críticas para el rendimiento, específicamente `libomp-dev` (OpenMP) para el soporte de computación paralela en XGBoost. El `Dockerfile` define el directorio de trabajo (`/home/app`), la copia de las dependencias (`requirements.txt`), el código fuente y los modelos pre-entrenados (`.pkl`).

## 2. ¿Por qué? (Justificación de Ingeniería)
El entrenamiento y la inferencia de modelos de Machine Learning dependen estrechamente de las versiones de las bibliotecas de bajo nivel y del compilador del sistema anfitrión. Docker garantiza el **aislamiento del entorno**, eliminando el riesgo de "en mi máquina funciona" (*It works on my machine*). Al utilizar `libomp-dev`, estamos habilitando el **multithreading** en el nivel de hardware, permitiendo que XGBoost utilice todos los núcleos disponibles de la CPU para acelerar las predicciones. La imagen `slim` se prefiere para reducir la superficie de ataque y el tiempo de despliegue en la infraestructura de Azure.

## 3. ¿Para qué? (Propósito de Negocio / Modelo)
El propósito es asegurar la **reproducibilidad y disponibilidad** del servicio de predicción en producción. En un entorno real (taquería), el modelo debe ser estable y rápido. Docker facilita el **escalado horizontal** y la actualización continua (*CI/CD*) del modelo sin interrumpir el servicio del Punto de Venta (POS). Esto garantiza que el personal de compras siempre tenga acceso a las recomendaciones de abastecimiento generadas por el algoritmo, independientemente de la infraestructura subyacente del servidor, manteniendo la continuidad operativa.
