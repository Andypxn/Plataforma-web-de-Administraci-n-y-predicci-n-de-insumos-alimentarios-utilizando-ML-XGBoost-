
---

## 📊 Plan de Pruebas de Calidad de Datos (ISO/IEC 25012) - Formato de Lista

Estas pruebas deben aplicarse a los datos crudos, antes de cualquier agregación o `feature engineering`.

### 1. Exactitud (Accuracy)
*Verifica si los valores de los datos son correctos y lógicos.*

* **Prueba: Cantidades no positivas**
    * **Pregunta de Negocio:** ¿Estamos registrando ventas con cero o devoluciones como ventas?
    * **Código:** `df[df['cantidad_pz'] <= 0]`
    * **Acción Recomendada:** Filtrar estos registros del dataset. Investigar en la BD si son errores de captura o devoluciones.

* **Prueba: Precios o costos no positivos**
    * **Pregunta de Negocio:** ¿Hay productos registrados con precios o costos nulos o negativos?
    * **Código:** `df[(df['precio_venta'] <= 0) | (df['costo_compra'] <= 0)]`
    * **Acción Recomendada:** Excluir registros. Crear una alerta para corregir los precios maestros si el problema es frecuente.

* **Prueba: Margen de ganancia negativo**
    * **Pregunta de Negocio:** ¿Estamos vendiendo productos por debajo de su costo estimado?
    * **Código:** `df[df['costo_compra'] >= df['precio_venta']]`
    * **Acción Recomendada:** Analizar. Pueden ser promociones válidas o errores en el cálculo del `costo_compra`. Documentar el hallazgo.

* **Prueba: Outliers extremos en `cantidad_pz`**
    * **Pregunta de Negocio:** ¿Existen ventas anómalas que puedan sesgar el modelo?
    * **Código:** `q99 = df['cantidad_pz'].quantile(0.999)` y luego `df[df['cantidad_pz'] > q99]`
    * **Acción Recomendada:** Marcar y revisar manualmente. Podrían ser ventas mayoristas que deban ser tratadas de forma especial.

### 2. Completitud (Completeness)
*Verifica si faltan datos en columnas críticas.*

* **Prueba: Nulos en identificadores clave**
    * **Pregunta de Negocio:** ¿Hay registros de venta que no podamos asignar a un producto o fecha?
    * **Código:** `df[df['fecha_orden'].isnull() | df['productos_id'].isnull()]`
    * **Acción Recomendada:** Eliminación obligatoria. Estos registros son inútiles para el modelo.

* **Prueba: Nulos en la variable objetivo (`cantidad_pz`)**
    * **Pregunta de Negocio:** ¿Hay transacciones registradas sin una cantidad vendida?
    * **Código:** `df[df['cantidad_pz'].isnull()]`
    * **Acción Recomendada:** Eliminar los registros. La variable objetivo no puede ser nula.

### 3. Consistencia (Consistency)
*Verifica la uniformidad de formatos y la ausencia de contradicciones.*

* **Prueba: Formato de `productos_id`**
    * **Pregunta de Negocio:** ¿Todos los IDs de producto siguen el mismo patrón (ej. `PROD_XXX`)?
    * **Código:** `df[~df['productos_id'].str.contains(r'^PROD_\d+$', na=False)]`
    * **Acción Recomendada:** Aplicar una rutina de limpieza para estandarizar todos los IDs al formato correcto.

* **Prueba: Coherencia `fecha` vs. `dia_de_la_semana`**
    * **Pregunta de Negocio:** ¿Las características generadas (ej. día de la semana) son correctas?
    * **Código:** `df['fecha_orden'] = pd.to_datetime(df['fecha_orden'])` seguido de `df[df['fecha_orden'].dt.dayofweek != df['dia_de_la_semana']]`
    * **Acción Recomendada:** Corregir la lógica de generación de características en el pipeline.

### 4. Actualidad (Currency)
*Mide qué tan recientes son los datos.*

* **Prueba: Desfase de los datos**
    * **Pregunta de Negocio:** ¿Estamos prediciendo con la información más reciente posible?
    * **Código:** `from datetime import datetime; desfase = (datetime.now() - df['fecha_orden'].max()).days`
    * **Acción Recomendada:** Si el desfase es mayor a 2-3 días, investigar cuellos de botella en la extracción de datos.

### 5. Unicidad (Uniqueness)
*Garantiza que no haya registros duplicados que inflen las ventas.*

* **Prueba: Duplicados en datos agregados**
    * **Pregunta de Negocio:** ¿Estamos contando dos veces las ventas de un producto en un mismo día?
    * **Código:** `df_agregado = df.groupby(['fecha_orden', 'productos_id']).sum()` y luego `df_agregado[df_agregado.duplicated()]`
    * **Acción Recomendada:** Revisar la lógica de agregación en el pipeline.

---

## 📝 Plantilla de Documentación del Reporte - Formato de Lista

### Reporte de Calidad de Datos - Pipeline de Predicción de Demanda

**Fecha de Evaluación:** 14 de octubre de 2025
**Dataset Evaluado:** `raw_sales_data_2025-07-14_to_2025-10-14.csv` (92,150 registros)
**Basado en:** Marco de Calidad de Datos ISO/IEC 25012

* **Característica: Exactitud**
    * **Prueba:** Cantidades no positivas (`<= 0`).
    * **Resultado:** Se encontraron 15 registros (0.016%).
    * **Acción Tomada:** Se filtran automáticamente. Se levanta alerta si el % supera el 0.1%.

* **Característica: Exactitud**
    * **Prueba:** Margen de ganancia negativo.
    * **Resultado:** 489 registros (0.53%) tenían `costo_compra` >= `precio_venta`.
    * **Acción Tomada:** Se validó que corresponden a ofertas "2x1". El pipeline los mantiene como válidos.

* **Característica: Completitud**
    * **Prueba:** Nulos en `productos_id`.
    * **Resultado:** 32 registros (0.034%) con ID nulo.
    * **Acción Tomada:** Eliminación automática de estos registros.

* **Característica: Consistencia**
    * **Prueba:** Formato de `productos_id`.
    * **Resultado:** 87 IDs no cumplían el formato `PROD_XXX`.
    * **Acción Tomada:** Se implementó una función de limpieza con expresiones regulares para estandarizar los formatos.

* **Característica: Actualidad**
    * **Prueba:** Desfase de los datos.
    * **Resultado:** El último registro es de hace 2 días (`2025-10-12`).
    * **Acción Tomada:** El desfase de 48h es aceptable y está dentro de los SLAs definidos.

* **Característica: Unicidad**
    * **Prueba:** Duplicados post-agregación.
    * **Resultado:** 0 duplicados encontrados.
    * **Acción Tomada:** La lógica de agregación `groupby(['fecha_orden', 'productos_id'])` funciona correctamente.

**Conclusión General:** La calidad de los datos de entrada es alta. El pipeline de ML maneja correctamente las pocas anomalías encontradas, asegurando que el modelo se entrene con datos limpios y consistentes.
