// Usamos django.jQuery para asegurar compatibilidad con la versión de jQuery que usa Django Admin
(function($) {
    // Verificamos si django.jQuery (que ahora es $) ya está cargado.
    // Aunque (function($){})(django.jQuery) debería bastar, esta verificación
    // adicional es una capa de seguridad para la temporización.
    if (typeof $ === 'undefined' || typeof $.fn === 'undefined') {
        // Si jQuery no está disponible por alguna razón (muy raro en Admin), salimos
        console.error("jQuery (django.jQuery) no está disponible. No se puede ejecutar admin_pregunta_condicional.js");
        return;
    }

    $(document).ready(function() {
        // --- 1. Identificar los elementos ---
        // El select del campo 'tipo' de la Pregunta
        const $tipoSelect = $('#id_tipo');

        // El fieldset que contiene el campo 'respuesta_correcta'
        // Usamos la clase CSS que le asignamos en fieldsets
        const $respuestaCorrectaFieldset = $('.directa-fieldset');

        // El div que contiene el inline de las Opciones
        // Django Admin le da un ID que termina en '-group'
        // 'opciones' es el related_name en tu ForeignKey de Opcion
        const $opcionesInlineGroup = $('h2#opciones-heading').closest('fieldset');


        // --- 2. Función para actualizar la visibilidad ---
        function actualizarVisibilidadCampos() {
            const tipoSeleccionado = $tipoSelect.val();

            if (tipoSeleccionado === 'directa') {
                $respuestaCorrectaFieldset.show(); // Mostrar campo de respuesta directa
                $opcionesInlineGroup.hide();     // Ocultar inline de opciones
                // Opcional: limpiar/desactivar campos del inline de opciones para evitar validaciones
                // $opcionesInlineGroup.find('input, select, textarea').prop('disabled', true);

            } else if (tipoSeleccionado === 'multiple_choice') {
                $respuestaCorrectaFieldset.hide(); // Ocultar campo de respuesta directa
                // Opcional: limpiar/desactivar el campo de respuesta directa para evitar validaciones
                // $('#id_respuesta_correcta').val(''); // Limpiar el valor
                // $('#id_respuesta_correcta').prop('disabled', true); // Desactivar el campo

                $opcionesInlineGroup.show();     // Mostrar inline de opciones
                // Opcional: re-habilitar campos del inline de opciones
                // $opcionesInlineGroup.find('input, select, textarea').prop('disabled', false);

            } else {
                // Si no hay tipo seleccionado o es otro valor, ocultar ambos por defecto
                $respuestaCorrectaFieldset.hide();
                $opcionesInlineGroup.hide();
                // Opcional: limpiar/desactivar ambos
                // $('#id_respuesta_correcta').val('');
                // $('#id_respuesta_correcta').prop('disabled', true);
                // $opcionesInlineGroup.find('input, select, textarea').prop('disabled', true);
            }
        }

        // --- 3. Ejecutar la función al cargar la página y en cada cambio ---
        // Ejecutar una vez al cargar la página para establecer el estado inicial
        actualizarVisibilidadCampos();

        // Añadir el event listener para el cambio en el select del tipo de pregunta
        $tipoSelect.on('change', actualizarVisibilidadCampos);
    });
})(django.jQuery); // Importante: usa django.jQuery para evitar conflictos