import Spinner from '../../../components/ui/Spinner';

export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <Spinner size="md" />
    </div>
  );
}
