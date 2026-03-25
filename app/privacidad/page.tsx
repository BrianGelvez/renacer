import type { Metadata } from 'next';
import LegalPageShell from '@/components/legal/LegalPageShell';

export const metadata: Metadata = {
  title: 'Política de privacidad | ENSIGNA',
  description:
    'Información sobre el tratamiento de datos personales en el sitio y servicios de ENSIGNA.',
};

export default function PrivacidadPage() {
  return (
    <LegalPageShell
      title="Política de privacidad"
      description="Información general sobre cómo se pueden tratar los datos personales al utilizar este sitio web y los servicios asociados."
    >
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          El titular del sitio y, en su caso, el responsable del tratamiento de
          los datos personales es la entidad que opera bajo la marca ENSIGNA o
          el centro médico vinculado, según corresponda en cada implementación.
        </p>
      </section>

      <section>
        <h2>2. Datos que se pueden recopilar</h2>
        <p>
          De forma genérica, y según los formularios o funcionalidades activas, se
          podrían recabar datos identificativos y de contacto (por ejemplo,
          nombre, correo electrónico, teléfono), datos relativos a la relación con
          la clínica o datos técnicos de navegación (dirección IP, tipo de
          dispositivo, cookies, cuando apliquen).
        </p>
      </section>

      <section>
        <h2>3. Finalidades</h2>
        <p>Las finalidades habituales incluyen, a título enunciativo:</p>
        <ul>
          <li>Gestionar consultas, solicitudes de información o contacto.</li>
          <li>Prestar servicios de salud o administrativos vinculados a la clínica.</li>
          <li>Mejorar la experiencia de uso del sitio y la seguridad de los sistemas.</li>
          <li>Cumplir obligaciones legales aplicables.</li>
        </ul>
      </section>

      <section>
        <h2>4. Base legal</h2>
        <p>
          El tratamiento se fundamentará en la ejecución de medidas
          precontractuales o contractuales, el consentimiento del interesado
          cuando sea necesario, el interés legítimo o el cumplimiento de
          obligaciones legales, según la normativa vigente en cada jurisdicción.
        </p>
      </section>

      <section>
        <h2>5. Conservación</h2>
        <p>
          Los datos se conservarán durante el tiempo necesario para cumplir las
          finalidades indicadas y las obligaciones legales o contractuales que
          resulten aplicables.
        </p>
      </section>

      <section>
        <h2>6. Cesiones y encargados</h2>
        <p>
          No se prevén cesiones a terceros salvo obligación legal, prestación
          mediante encargados de tratamiento (por ejemplo, proveedores de
          hosting o mensajería) bajo las garantías que exija la ley, o cuando el
          usuario haya sido informado y, en su caso, haya consentido.
        </p>
      </section>

      <section>
        <h2>7. Derechos de las personas interesadas</h2>
        <p>
          Según la legislación aplicable, podrías ejercer derechos de acceso,
          rectificación, supresión, oposición, limitación del tratamiento,
          portabilidad u otros reconocidos. Para ello, podrás dirigirte a los
          canales de contacto publicados por la clínica.
        </p>
      </section>

      <section>
        <h2>8. Seguridad</h2>
        <p>
          Se adoptarán medidas técnicas y organizativas razonables para proteger
          la información frente a accesos no autorizados, pérdida o alteración,
          sin que ello suponga una garantía absoluta de seguridad.
        </p>
      </section>

      <section>
        <h2>9. Menores</h2>
        <p>
          Los servicios no están dirigidos a menores de edad sin el
          consentimiento o autorización de sus titulares de la responsabilidad
          parental, cuando la normativa así lo exija.
        </p>
      </section>

      <section>
        <h2>10. Cambios</h2>
        <p>
          Esta política puede actualizarse para reflejar cambios en el servicio o
          en la normativa. Se recomienda revisarla periódicamente.
        </p>
      </section>
    </LegalPageShell>
  );
}
