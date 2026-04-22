import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import ChatList from "./components/ChatList";
import Chat from "./components/Chat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
