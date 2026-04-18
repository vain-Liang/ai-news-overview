import { AppRouter } from "./router";
import { AuthProvider } from "../features/auth/context/AuthProvider";
import { ThemeProvider } from "../shared/theme/theme-provider";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
