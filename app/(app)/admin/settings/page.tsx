import AdminSettingsForm from './AdminSettingsForm';

export default async function AdminSettings() {
  return (
    <main className='px-4 lg:px-6'>
      <h1 className='text-2xl font-semibold my-4'>Account</h1>
      <div className='space-y-4'>
        <AdminSettingsForm />
      </div>
    </main>
  );
}
