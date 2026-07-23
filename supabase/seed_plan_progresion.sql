-- ============================================================================
-- Club Prat — Gestor de Entrenamiento
-- Semilla: contenido planificado por categoría, extraído de
-- plan_entrenamiento_progresion.docx. Correr después de schema.sql y seed.sql.
-- ============================================================================

-- Mini (U11) — progresión de 8 sesiones (unidad base, repetible por trimestre)
insert into plan_progresion (categoria_id, orden, titulo, contenido) values
('00000000-0000-4000-8000-000000000021', 1, 'Cancha dividida + pase de antebrazos',
 'Juegos de cancha dividida con distintos móviles (globo, balón blando, indiaca) + pase de antebrazos.' || chr(10) || chr(10) ||
 'Foco: coordinación, cálculo de trayectorias, primer contacto con el balón.'),
('00000000-0000-4000-8000-000000000021', 2, 'Cancha dividida + pase de antebrazos (cont.)',
 'Juegos de cancha dividida con distintos móviles (globo, balón blando, indiaca) + pase de antebrazos.' || chr(10) || chr(10) ||
 'Foco: coordinación, cálculo de trayectorias, primer contacto con el balón.'),
('00000000-0000-4000-8000-000000000021', 3, 'Pase de dedos',
 'Pase de dedos.' || chr(10) || chr(10) ||
 'Foco: manejo fino de balón, control por arriba.'),
('00000000-0000-4000-8000-000000000021', 4, 'Saque de abajo',
 'Saque de abajo.' || chr(10) || chr(10) ||
 'Foco: primer gesto de saque, continuidad del juego.'),
('00000000-0000-4000-8000-000000000021', 5, 'Integración de gestos',
 'Integración: antebrazos + dedos + saque en jugadas de 2–3 toques.' || chr(10) || chr(10) ||
 'Foco: enlazar gestos, cooperación "con" el compañero.'),
('00000000-0000-4000-8000-000000000021', 6, 'Sesión teórica: reglamento',
 'Sesión teórica: reglamento de minivoley + repaso conceptual.' || chr(10) || chr(10) ||
 'Foco: comprensión del juego, toma de conciencia.'),
('00000000-0000-4000-8000-000000000021', 7, 'Bloqueo + organización básica',
 'Bloqueo + organización básica de equipo en cancha.' || chr(10) || chr(10) ||
 'Foco: primer gesto defensivo, ubicación espacial.'),
('00000000-0000-4000-8000-000000000021', 8, 'Cierre competitivo',
 'Cierre competitivo: mini-torneo interno con 3 toques obligatorios.' || chr(10) || chr(10) ||
 'Foco: aplicación de todo lo aprendido, disfrute de la competencia.');

-- Sub15 Damas — progresión por fundamento (contenido de iniciación)
insert into plan_progresion (categoria_id, orden, titulo, contenido) values
('00000000-0000-4000-8000-000000000022', 1, 'Saque',
 'Contenido de iniciación: saque de abajo consolidado → introducción de saque de tenis (por arriba, sin salto).' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: saque flotante en salto o con salto de potencia.'),
('00000000-0000-4000-8000-000000000022', 2, 'Recepción',
 'Contenido de iniciación: postura base, plataforma de antebrazos, recepción de saque de abajo/tenis.' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: recepción de saques con mayor velocidad y efecto, lectura de trayectoria.'),
('00000000-0000-4000-8000-000000000022', 3, 'Colocación / Armado',
 'Contenido de iniciación: pase de dedos preciso a un colocador fijo, entrega a zonas 4 y 2.' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: armado con desplazamiento, variedad de entregas (rápidas, combinadas).'),
('00000000-0000-4000-8000-000000000022', 4, 'Ataque',
 'Contenido de iniciación: remate simple desde zona 4, aproximación de 3 pasos.' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: remate desde múltiples zonas, lectura de bloqueo.'),
('00000000-0000-4000-8000-000000000022', 5, 'Bloqueo',
 'Contenido de iniciación: bloqueo individual, lectura de armador.' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: bloqueo en sistema (doble bloqueo, lectura de ataque).'),
('00000000-0000-4000-8000-000000000022', 6, 'Defensa',
 'Contenido de iniciación: postura de defensa, desplazamientos básicos en zona 6/5/1.' || chr(10) || chr(10) ||
 'Progresión hacia Sub18: defensa en sistema, cobertura de ataque.');

-- Sub18 Damas / Varones — perfeccionamiento técnico por fundamento
insert into plan_progresion (categoria_id, orden, titulo, contenido) values
('00000000-0000-4000-8000-000000000023', 1, 'Saque',
 'Foco de perfeccionamiento: consistencia + variantes con efecto (flotante, potencia) según perfil de la jugadora/or.'),
('00000000-0000-4000-8000-000000000023', 2, 'Recepción',
 'Foco de perfeccionamiento: lectura anticipada del saque rival, reducción de errores en recepción.'),
('00000000-0000-4000-8000-000000000023', 3, 'Colocación / Armado',
 'Foco de perfeccionamiento: velocidad de entrega, variedad táctica (combinadas, segundo tempo), toma de decisión bajo presión.'),
('00000000-0000-4000-8000-000000000023', 4, 'Ataque',
 'Foco de perfeccionamiento: diversificación de zonas y tipos de remate, lectura del bloqueo rival.'),
('00000000-0000-4000-8000-000000000023', 5, 'Bloqueo',
 'Foco de perfeccionamiento: coordinación de sistema, timing de salto, lectura de armador.'),
('00000000-0000-4000-8000-000000000023', 6, 'Defensa',
 'Foco de perfeccionamiento: cobertura de ataque propio, sistemas de defensa según rotación.');
