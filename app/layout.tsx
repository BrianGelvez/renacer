import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ConditionalChatbot from '@/components/ConditionalChatbot'; // Importa el nuevo componente

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Renacer - Centro Médico | Tecnología y Excelencia en Salud',
  description:
    'Centro médico de vanguardia que combina excelencia profesional con tecnología avanzada para brindarte la mejor atención médica.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} w-full overflow-x-hidden`}>
      <body
        className={`${inter.className} font-sans w-full overflow-x-hidden ensigna-page-bg text-ensigna-text antialiased`}
      >
        <AuthProvider>
          {children}
          {/* El componente ahora decide internamente si mostrarse o no */}
          <ConditionalChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}