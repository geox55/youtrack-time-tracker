import { AppProvider } from '@/app/providers';
import { Layout } from '@/app/components';
import { TrackerPage } from '@/pages';
import { ToastContainer } from 'react-toastify';

const App = () => {
  return (
    <AppProvider>
      <Layout>
        <TrackerPage />
      </Layout>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AppProvider>
  );
};

export default App;
