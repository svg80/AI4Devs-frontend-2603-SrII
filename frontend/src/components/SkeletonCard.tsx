import React from 'react';
import { Card, Placeholder } from 'react-bootstrap';

/**
 * Skeleton placeholder that mirrors the shape of CandidateCard.
 *
 * Used while candidate data is being fetched to give a visual indication
 * of loading content. Matches the same padding, shadow, and dimensions
 * as a real candidate card.
 */
const SkeletonCard: React.FC = () => (
  <Card className="shadow-sm mb-2" role="status" aria-label="Cargando candidato...">
    <Card.Body className="py-2 px-3">
      <Placeholder as={Card.Title} animation="glow" className="fs-6 mb-0">
        <Placeholder xs={8} />
      </Placeholder>
      <Placeholder as={Card.Text} animation="glow" className="mb-0">
        <Placeholder xs={4} />
      </Placeholder>
    </Card.Body>
  </Card>
);

export default SkeletonCard;
