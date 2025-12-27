import AppLayout from '@/components/layouts/app-layout';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
