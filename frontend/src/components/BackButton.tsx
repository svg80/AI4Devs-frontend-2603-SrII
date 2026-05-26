import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

interface BackButtonProps {
  /** Route to navigate back to. Defaults to '/positions' */
  to?: string;
}

/**
 * Reusable back-navigation button.
 * Renders as a link-styled button with a left arrow.
 */
const BackButton: React.FC<BackButtonProps> = ({ to = '/positions' }) => (
  <Link to={to} aria-label="Volver al listado de posiciones">
    <Button
      variant="outline-secondary"
      size="sm"
      style={{ minWidth: '44px', minHeight: '44px' }}
    >
      ← Volver
    </Button>
  </Link>
);

export default BackButton;
