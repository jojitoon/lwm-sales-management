'use client';
import UpdateSession from './UpdateSession';
import ResetDatabase from './ResetDatabase';
import BackupRestore from './BackupRestore';

export default function AdminSettingsForm() {
  return (
    <>
      <UpdateSession />
      <ResetDatabase />
      <BackupRestore />
    </>
  );
}
