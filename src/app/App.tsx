import { AppProvider } from '@/app/providers';
import { Layout } from '@/app/components';
import { TrackerPage } from '@/pages';

const App = () => {
  return (
    <AppProvider>
      <Layout>
        <TrackerPage />
      </Layout>
    </AppProvider>
  );
};

export default App;
