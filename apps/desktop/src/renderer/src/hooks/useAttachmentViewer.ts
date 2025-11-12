/**
 * Hook for managing AttachmentViewer state
 */

import { useState, useCallback } from 'react';
import type { Attachment } from '../types/attachment';

export function useAttachmentViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAttachment, setCurrentAttachment] = useState<Attachment | null>(null);
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Open viewer with a specific attachment
   */
  const openViewer = useCallback((attachment: Attachment, attachments?: Attachment[]) => {
    setCurrentAttachment(attachment);

    if (attachments && attachments.length > 0) {
      setAllAttachments(attachments);
      const index = attachments.findIndex((a) => a.id === attachment.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setAllAttachments([attachment]);
      setCurrentIndex(0);
    }

    setIsOpen(true);
  }, []);

  /**
   * Close viewer
   */
  const closeViewer = useCallback(() => {
    setIsOpen(false);
    // Delay reset to allow animation
    setTimeout(() => {
      setCurrentAttachment(null);
      setAllAttachments([]);
      setCurrentIndex(0);
    }, 200);
  }, []);

  /**
   * Navigate to a specific index
   */
  const navigateToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < allAttachments.length) {
        setCurrentIndex(index);
        setCurrentAttachment(allAttachments[index]);
      }
    },
    [allAttachments]
  );

  /**
   * Navigate to next attachment
   */
  const navigateNext = useCallback(() => {
    if (currentIndex < allAttachments.length - 1) {
      navigateToIndex(currentIndex + 1);
    }
  }, [currentIndex, allAttachments.length, navigateToIndex]);

  /**
   * Navigate to previous attachment
   */
  const navigatePrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateToIndex(currentIndex - 1);
    }
  }, [currentIndex, navigateToIndex]);

  return {
    // State
    isOpen,
    currentAttachment,
    allAttachments,
    currentIndex,

    // Actions
    openViewer,
    closeViewer,
    navigateToIndex,
    navigateNext,
    navigatePrevious,
  };
}
