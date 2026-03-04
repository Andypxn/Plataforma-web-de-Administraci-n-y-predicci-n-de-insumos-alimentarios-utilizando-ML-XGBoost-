# Guía Rápida de Uso - Análisis XGBoost

## Instalación en 3 Pasos

### 1 Instalar Dependencias

```bash
cd analisis-tesis-xgboost
bash setup.sh
```

### 2 Configurar Credenciales

```bash
cp .env.example .env
nano .env  # O usa tu editor favorito
```

**Edita el archivo .env con tus credenciales:**
```env
DB_URL=jdbc:postgresql://localhost:5432/pos_fin
DB_USER=tu_usuario
DB_PASS=tu_contraseña
```

### 3 Ejecutar Fase 1

```bash
source venv/bin/activate
python scripts/analisis_abastecimiento_xgboost.py
```

---

##  ¿Qué hace la Fase 1?

La Fase 1 realiza el análisis de datos reales de tu base de datos:

**Paso 1**: Conecta a PostgreSQL  
**Paso 2**: Busca fechas con muchas transacciones  
**Paso 3**: Extrae datos de 5 días consecutivos  
**Paso 4**: Calcula estadísticas descriptivas  
**Paso 5**: Identifica tendencias (creciente/decreciente/estable)  

---

## Archivos Generados

Después de ejecutar la Fase 1, encontrarás:

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| **Datos CSV** | `data/ventas_5_dias_reales.csv` | Dataset con ventas por día |
| **Reporte** | `results/analisis_descriptivo_5_dias.txt` | Análisis completo con estadísticas |
| **Log** | `results/ejecucion.log` | Log detallado de la ejecución |

---

## Ver Resultados

### Ver reporte de análisis

```bash
cat results/analisis_descriptivo_5_dias.txt
```

### Ver datos en CSV

```bash
head -n 20 data/ventas_5_dias_reales.csv
```

### Ver log de ejecución

```bash
tail -n 100 results/ejecucion.log
```

---

##  Solución de Problemas

###  Error: "Faltan variables de entorno"

**Causa**: No existe el archivo `.env` o está vacío

**Solución**:
```bash
cp .env.example .env
nano .env  # Completa las credenciales
```

---

###  Error: "No se puede conectar a la base de datos"

**Causa 1**: PostgreSQL no está corriendo

**Solución**:
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

**Causa 2**: Credenciales incorrectas en `.env`

**Solución**: Verifica usuario y contraseña en el archivo `.env`

---

###  Error: "ModuleNotFoundError: No module named 'pandas'"

**Causa**: No se han instalado las dependencias

**Solución**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

###  Warning: "No se encontraron datos en el rango especificado"

**Causa**: La tabla `ordenes_de_ventas` está vacía o tiene pocos datos

**Solución**: Verifica que hay datos en la tabla:
```sql
SELECT COUNT(*) FROM ordenes_de_ventas;
SELECT MIN(fecha_orden), MAX(fecha_orden) FROM ordenes_de_ventas;
```

---

##  Próximos Pasos

Una vez completada la **Fase 1**, procederás con:

- **Fase 2**: Generación de datos sintéticos (6 meses)
- **Fase 3**: Preparación de datasets
- **Fase 4**: Entrenamiento de modelos XGBoost
- **Fase 5**: Comparación de métricas (MAE, RMSE)
- **Fase 6**: Curvas de aprendizaje
- **Fase 7**: Visualización con Matplotlib

---

##  Soporte

Si encuentras problemas, revisa:

1. **Log de ejecución**: `results/ejecucion.log`
2. **README completo**: `README.md`
3. **Configuración**: Verifica archivo `.env`

---

**Última actualización**: 28 Enero 2026  
**Estado**: Fase 1 lista para usar 
