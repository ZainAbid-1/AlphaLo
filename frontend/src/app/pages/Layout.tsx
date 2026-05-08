import { Outlet } from 'react-router';
import Navbar from './Navbar';
import { Container } from 'react-bootstrap';

export default function Layout() {
  return (
    <div className="app-container">
      <Navbar />
      <Container fluid className="p-0">
        <Outlet />
      </Container>
    </div>
  );
}

