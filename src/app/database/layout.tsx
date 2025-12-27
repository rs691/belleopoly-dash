import AppLayout from '@/components/layouts/app-layout';

export default function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
