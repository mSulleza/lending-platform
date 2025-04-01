"use client";

import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";

interface GenerateContractButtonProps {
  loanId: string;
  hasContract: boolean;
  onSuccess?: () => void;
}

export default function GenerateContractButton({
  loanId,
  hasContract,
  onSuccess,
}: GenerateContractButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractType, setContractType] = useState("promissory");
  const [error, setError] = useState("");
  const [generatedDocxUrl, setGeneratedDocxUrl] = useState("");
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState("");
  const [pdfAvailable, setPdfAvailable] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
    setError("");
    setIsComplete(false);
    setGeneratedDocxUrl("");
    setGeneratedPdfUrl("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // If contract was generated successfully, call the onSuccess callback
    if (isComplete && onSuccess) {
      onSuccess();
    }
  };

  const handleGenerateContract = async () => {
    setIsGenerating(true);
    setError("");
    setGeneratedDocxUrl("");
    setGeneratedPdfUrl("");
    setPdfAvailable(true);
    setIsComplete(false);

    try {
      const response = await fetch(`/api/schedules/${loanId}/contracts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate contract");
      }

      const data = await response.json();
      setGeneratedDocxUrl(data.docxPath);
      setGeneratedPdfUrl(data.pdfPath);
      setPdfAvailable(data.pdfAvailable);
      setIsComplete(true);
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred while generating the contract");
      console.error("Error generating contract:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const contractTypeOptions = [
    { value: "promissory", label: "Promissory Note" },
    { value: "guarantee", label: "Letter of Guarantee" },
  ];

  return (
    <>
      <Button
        color={hasContract ? "default" : "primary"}
        variant={hasContract ? "flat" : "solid"}
        onPress={openModal}
        startContent={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9m-7-7L18 9m-5-7v7h7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        {hasContract ? "Regenerate Contract" : "Generate Contract"}
      </Button>

      <Modal isOpen={isModalOpen} onClose={closeModal} size="lg">
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Generate Contract
              </ModalHeader>
              <ModalBody>
                {isComplete ? (
                  <div className="space-y-4">
                    <p className="text-success">
                      Contract was generated successfully!
                    </p>
                    <div className="flex flex-col gap-2">
                      <p className="font-semibold">Download Documents:</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          as="a"
                          href={generatedDocxUrl}
                          target="_blank"
                          download
                          color="primary"
                          variant="flat"
                          startContent={
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          }
                        >
                          Download DOCX
                        </Button>
                        {pdfAvailable ? (
                          <Button
                            as="a"
                            href={generatedPdfUrl}
                            target="_blank"
                            download
                            color="primary"
                            startContent={
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            }
                          >
                            Download PDF
                          </Button>
                        ) : (
                          <p className="text-warning text-sm">
                            PDF conversion not available. LibreOffice is required for PDF conversion.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>
                      This will generate a contract document based on the loan
                      information. You can choose which type of contract to
                      generate:
                    </p>
                    <Select
                      label="Contract Type"
                      placeholder="Select contract type"
                      selectedKeys={[contractType]}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setContractType(e.target.value)}
                      fullWidth
                    >
                      {contractTypeOptions.map((option) => (
                        <SelectItem key={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                    {error && (
                      <p className="text-danger text-sm mt-2">{error}</p>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {isComplete ? (
                  <Button color="success" onPress={onClose}>
                    Done
                  </Button>
                ) : (
                  <>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleGenerateContract}
                      isDisabled={isGenerating}
                      isLoading={isGenerating}
                    >
                      Generate
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
} 