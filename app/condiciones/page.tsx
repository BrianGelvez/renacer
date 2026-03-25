import type { Metadata } from 'next';
import LegalPageShell from '@/components/legal/LegalPageShell';

export const metadata: Metadata = {
  title: 'Condiciones del servicio | ENSIGNA',
  description:
    'Términos generales de uso del sitio web y de los servicios digitales de ENSIGNA.',
};

export default function CondicionesPage() {
  return (
    <LegalPageShell
      title="Condiciones del servicio"
      description="Términos generales de uso del sitio web y, en su caso, de las herramientas digitales puestas a disposición por la clínica."
    >
      <section>
        <h2>1. Objeto</h2>
        <p>
          Las presentes condiciones regulan el acceso y uso del sitio web y de los
          servicios en línea ofrecidos de forma genérica bajo la marca ENSIGNA o
          por el centro médico asociado. El uso del sitio implica la aceptación
          de estas condiciones en la medida en que resulten aplicables.
        </p>
      </section>

      <section>
        <h2>2. Información del sitio</h2>
        <p>
          Los contenidos tienen carácter informativo y no sustituyen el consejo
          médico profesional. Las decisiones sobre salud deben tomarse con un
          profesional habilitado. La clínica puede modificar la información del
          sitio sin previo aviso.
        </p>
      </section>

      <section>
        <h2>3. Uso permitido</h2>
        <p>El usuario se compromete a:</p>
        <ul>
          <li>Utilizar el sitio de conformidad con la ley y las buenas costumbres.</li>
          <li>No realizar actividades que puedan dañar sistemas, redes o terceros.</li>
          <li>No intentar acceder a áreas restringidas sin autorización.</li>
          <li>No utilizar el sitio para fines ilícitos o no autorizados.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cuentas y accesos</h2>
        <p>
          Si existiera registro de usuario o acceso a un área privada, el usuario
          será responsable de la confidencialidad de sus credenciales y de las
          actividades realizadas con su cuenta. La clínica podrá suspender el
          acceso ante uso indebido o incumplimiento de estas condiciones.
        </p>
      </section>

      <section>
        <h2>5. Propiedad intelectual</h2>
        <p>
          Los textos, imágenes, logotipos, diseño y demás contenidos del sitio
          están protegidos por la normativa aplicable. Queda prohibida su
          reproducción o distribución sin autorización, salvo uso privado o
          citas permitidas por la ley.
        </p>
      </section>

      <section>
        <h2>6. Enlaces a terceros</h2>
        <p>
          El sitio puede incluir enlaces a páginas externas. La clínica no
          controla ni responde por el contenido o las políticas de dichos sitios.
        </p>
      </section>

      <section>
        <h2>7. Limitación de responsabilidad</h2>
        <p>
          En la medida permitida por la ley, la clínica no será responsable por
          daños indirectos, lucro cesante, pérdida de datos o interrupciones del
          servicio derivadas del uso del sitio. El sitio se ofrece &quot;tal
          cual&quot;, procurando su disponibilidad razonable sin garantía
          absoluta de funcionamiento ininterrumpido.
        </p>
      </section>

      <section>
        <h2>8. Legislación y jurisdicción</h2>
        <p>
          Para la resolución de controversias se aplicará la legislación vigente
          en el país o región donde opere el titular del servicio, sometiéndose
          las partes a los tribunales competentes de dicho territorio, salvo
          norma imperativa en contrario.
        </p>
      </section>

      <section>
        <h2>9. Modificaciones</h2>
        <p>
          Estas condiciones pueden actualizarse. Los cambios relevantes podrán
          publicarse en esta misma página indicando la fecha de actualización.
          El uso continuado del sitio tras los cambios puede implicar la aceptación
          de las nuevas condiciones.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
        <p>
          Para consultas sobre estas condiciones, utilizá los datos de contacto
          publicados en el sitio (pie de página o sección de contacto).
        </p>
      </section>
    </LegalPageShell>
  );
}
