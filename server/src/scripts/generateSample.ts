import { generateDeliverablePDF } from '../services/pdfService';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('Generando PDF de muestra...');

    const sampleTitle = 'DIAGNOSTICO_ESTRATEGICO_SAMPLE';
    const sampleContent = `
# Diagnóstico Estratégico - Paradixe

## 1. Resumen Ejecutivo
Este documento presenta el análisis inicial de viabilidad para el proyecto "Adán", un asistente de IA enfocado en emprendedores. La oportunidad de mercado es clara dado el auge de la IA y la necesidad de consultoría accesible.

## 2. Análisis del Dolor (Pain Points)
- Los emprendedores carecen de guía estructurada.
- La consultoría tradicional es costosa.
- La información en internet está fragmentada.

## 3. Propuesta de Valor
Adán ofrece una metodología probada (EDEN) combinada con la eficiencia de la IA generativa, proporcionando entregables tangibles en minutos en lugar de semanas.

## 4. Próximos Pasos Recomendados
1. Validar el MVP con 10 usuarios beta.
2. Refinar el prompt del sistema para el Nivel 1.
3. Integrar pasarela de pagos para monetización Nivel 2.

---
Generado automáticamente por el sistema Adán.
`;

    try {
        const buffer = await generateDeliverablePDF(sampleTitle, sampleContent);

        // Assuming running from 'server' directory
        const outputPath = path.join(process.cwd(), 'temp', `${sampleTitle}.pdf`);
        fs.writeFileSync(outputPath, buffer);

        console.log(`✅ PDF generado exitosamente en: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error generando PDF:', error);
    }
}

main();
