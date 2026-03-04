# Reporte Técnico 05: Guía Maestra para el Examen Profesional - Defensa de Tesis

## 1. ¿Qué paso? (Resumen Estratégico)
Se consolidó una serie de respuestas técnicas de nivel experto para abordar las posibles preguntas de los sinodales durante la defensa de la tesis del modelo de abastecimiento con XGBoost para la taquería. La guía se estructuró para demostrar dominio sobre el **procesamiento de datos**, la **arquitectura del modelo** y el **valor de negocio**.

## 2. ¿Por qué? (Justificación de Ingeniería - FAQ Técnico)

### P1: ¿Cómo manejó el sobreajuste (Overfitting) en su modelo de 6 meses?
**Respuesta:** *"Utilicé una combinación de técnicas de regularización incorporadas en XGBoost, específicamente los parámetros `alpha` (L1) y `lambda` (L2) para penalizar la complejidad de los árboles. Además, empleé `subsample=0.8` para introducir estocasticidad en cada iteración del gradiente, asegurando que el modelo generalice bien y no se aprenda el ruido específico de los datos sintéticos."*

### P2: ¿Por qué eligió XGBoost en lugar de una Red Neuronal Recurrente (LSTM)?
**Respuesta:** *"Dada la naturaleza tabular de los datos y el volumen disponible, XGBoost ofrece una mayor eficiencia computacional y una interpretabilidad superior mediante el **Feature Importance**. Las redes LSTM requieren una mayor cantidad de datos y potencia de cálculo, lo cual no es costo-efectivo para una implementación local en una taquería, donde XGBoost ya alcanza un RMSE óptimo."*

### P3: ¿Cómo validó la precisión de su modelo antes del despliegue?
**Respuesta:** *"Implementé una validación cruzada temporal (**Time Series Cross-Validation**) con 5 pliegues (*folds*). Esto es crítico para series de tiempo, ya que no podemos entrenar con datos del futuro para predecir el pasado. Validé las métricas de MAE y RMSE en un conjunto de prueba independiente para asegurar la estabilidad de las predicciones."*

## 3. ¿Para qué? (Propósito de Negocio / Modelo)
El objetivo es demostrar que el modelo no es solo una "caja negra" (*black box*), sino una herramienta de ingeniería robusta diseñada bajo principios científicos. Al explicar la importancia de las características (*feature importance*), podemos mostrar al jurado qué factores (clima, quincena, día festivo) influyen más en la compra de carne, demostrando que el modelo ha aprendido la **lógica del negocio** y no solo patrones matemáticos aislados. Esto refuerza la validez de la tesis como una solución real y aplicable a la industria restaurantera.
