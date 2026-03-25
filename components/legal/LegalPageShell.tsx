import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LegalPageShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function LegalPageShell({
  title,
  description,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <Header />
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <article className="max-w-3xl mx-auto">
          <nav
            className="text-sm text-gray-500 mb-8"
            aria-label="Migas de pan"
          >
            <Link href="/" className="hover:text-red-600 transition-colors">
              Inicio
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-800 font-medium">{title}</span>
          </nav>

          <header className="mb-10 pb-8 border-b border-gray-200">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-gray-600 text-lg leading-relaxed">
                {description}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-gray-500">
              Última actualización: marzo de {new Date().getFullYear()}. El
              texto es genérico y debe ser revisado por asesoría legal antes de
              uso en producción.
            </p>
          </header>

          <div className="space-y-10 [&_section]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:space-y-2 [&_li]:text-gray-600 [&_li]:leading-relaxed">
            {children}
          </div>

          <p className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
            ¿Consultas? Podés contactar a la clínica a través de los medios
            indicados en el sitio o en el pie de página.
          </p>
        </article>
      </main>
      <Footer clinic={null} />
    </div>
  );
}
