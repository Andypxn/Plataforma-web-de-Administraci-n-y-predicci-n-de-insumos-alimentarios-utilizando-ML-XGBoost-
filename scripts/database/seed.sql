-- SmartPOS: Script de Datos de Ejemplo (Seed)
-- Propósito: Llenar la base de datos con transacciones realistas para probar el motor de ML.

-- 1. Insertar Categorías y Productos (Taquería)
INSERT INTO categorias (id, nombre, descripcion) VALUES (1, 'Carnes', 'Insumos de carne fresca');
INSERT INTO categorias (id, nombre, descripcion) VALUES (2, 'Verduras', 'Vegetales y hortalizas');
INSERT INTO categorias (id, nombre, descripcion) VALUES (3, 'Bebidas', 'Refrescos y aguas frescas');

INSERT INTO productos (id, nombre, descripcion, precio_venta, stock_actual, stock_minimo, categoria_id) VALUES (1, 'Bistec', 'Bistec de res de primera', 150.00, 25.5, 5.0, 1);
INSERT INTO productos (id, nombre, descripcion, precio_venta, stock_actual, stock_minimo, categoria_id) VALUES (2, 'Pastor', 'Carne de cerdo marinada', 120.00, 30.0, 8.0, 1);
INSERT INTO productos (id, nombre, descripcion, precio_venta, stock_actual, stock_minimo, categoria_id) VALUES (3, 'Cebolla', 'Cebolla blanca fresca', 15.00, 10.0, 2.0, 2);
INSERT INTO productos (id, nombre, descripcion, precio_venta, stock_actual, stock_minimo, categoria_id) VALUES (4, 'Cilantro', 'Cilantro fresco manojo', 8.00, 5.0, 1.0, 2);

-- 2. Simular Transacciones (Ventas Históricas Simplificadas)
-- Estos datos permiten al modelo XGBoost empezar a detectar patrones.
INSERT INTO ordenes_de_ventas (id, fecha_orden, total_venta, usuario_id) VALUES (1001, CURRENT_DATE - INTERVAL '1 day', 450.00, 1);
INSERT INTO ordenes_de_ventas (id, fecha_orden, total_venta, usuario_id) VALUES (1002, CURRENT_DATE - INTERVAL '2 days', 380.00, 1);
INSERT INTO ordenes_de_ventas (id, fecha_orden, total_venta, usuario_id) VALUES (1003, CURRENT_DATE - INTERVAL '3 days', 520.00, 1);

-- 3. Detalle de Ventas
INSERT INTO detalle_ventas (id, orden_id, producto_id, cantidad, precio_unitario) VALUES (1, 1001, 1, 2.5, 150.00);
INSERT INTO detalle_ventas (id, orden_id, producto_id, cantidad, precio_unitario) VALUES (2, 1001, 3, 0.5, 15.00);
INSERT INTO detalle_ventas (id, orden_id, producto_id, cantidad, precio_unitario) VALUES (3, 1002, 2, 3.0, 120.00);
