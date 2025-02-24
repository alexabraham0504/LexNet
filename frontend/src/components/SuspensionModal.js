import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(145deg, #ffffff, #f3f4f6);
  padding: 2.5rem;
  border-radius: 20px;
  max-width: 450px;
  width: 90%;
  position: relative;
  animation: ${slideIn} 0.4s ease-out;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, #dc2626, #ef4444);
    border-radius: 20px 20px 0 0;
  }
`;

const Header = styled.div`
  color: #dc2626;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: -0.5px;

  svg {
    width: 32px;
    height: 32px;
    filter: drop-shadow(0 2px 4px rgba(220, 38, 38, 0.2));
  }
`;

const SubHeader = styled.div`
  color: #991b1b;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    display: block;
    width: 4px;
    height: 4px;
    background-color: currentColor;
    border-radius: 50%;
  }
`;

const ReasonMessage = styled.div`
  background: linear-gradient(145deg, #fef2f2, #fee2e2);
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: #991b1b;
  font-size: 1.1rem;
  line-height: 1.6;
  border: 1px solid rgba(220, 38, 38, 0.1);
  box-shadow: 
    0 2px 4px rgba(220, 38, 38, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const Date = styled.div`
  color: #4b5563;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 18px;
    height: 18px;
    color: #6b7280;
  }
`;

const Message = styled.div`
  color: #4b5563;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-style: italic;
  padding-left: 1rem;
  border-left: 3px solid #e5e7eb;
`;

const Button = styled.button`
  background: linear-gradient(145deg, #dc2626, #b91c1c);
  color: white;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
    background: linear-gradient(145deg, #ef4444, #dc2626);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
  }
`;

const SuspensionModal = ({ details, onClose }) => {
  const formatDate = (dateString) => {
    try {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date) 
        ? date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : null;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  const formattedDate = formatDate(details?.suspendedAt);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Account Suspended
        </Header>
        
        <SubHeader>Suspension Reason</SubHeader>
        <ReasonMessage>
          {details?.reason || 'Your account has been suspended.'}
        </ReasonMessage>

        {formattedDate && (
          <Date>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
            Suspended on: {formattedDate}
          </Date>
        )}
        
        <Message>
          {details?.message || 'Please contact administrator for assistance.'}
        </Message>
        
        <Button onClick={onClose}>
          Understood
        </Button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SuspensionModal; 