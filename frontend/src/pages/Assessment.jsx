import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SectionContainer from "../Components/SectionContainer";
import { decryptData } from "../utils/decryptionHelper";
import { encryptSectionData } from "../utils/encryptHelper";

function Assessment() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [sectionCompletion, setSectionCompletion] = useState({});
  const [questionData, setQuestionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);

  // Fetch question data on component mount
  useEffect(() => {
    const getQuestions = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/candidate/questions`
        );

        console.log("API response received");

        if (!res.data || !res.data.data) {
          throw new Error("Invalid API response format");
        }

        // Decrypt the data
        const decrypted = decryptData(
          res.data.data,
          import.meta.env.VITE_SECRET_KEY
        );

        if (!decrypted || !Array.isArray(decrypted)) {
          throw new Error("Decrypted data is not in the expected format");
        }

        console.log("Questions loaded successfully");
        setQuestionData(decrypted);
        console.log(decrypted);
      } catch (err) {
        console.error("Error loading questions:", err);
        setError(`Failed to load assessment questions: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    getQuestions();
  }, []);

  // Check if the question allows multiple selections
  const isMultiSelectQuestion = (questionText) => {
    return (
      questionText.toLowerCase().includes("choose all that apply") ||
      questionText.toLowerCase().includes("choose up to")
    );
  };

  // Update the handleAnswerSelect function with debug logging
  const handleAnswerSelect = (questionId, optionId) => {
    console.log(`Selected option ${optionId} for question ${questionId}`);

    // Simple direct object update with the new selection
    setSelectedOptions((prev) => {
      const newSelections = {
        ...prev,
        [questionId]: optionId,
      };
      console.log("Updated selections:", newSelections);
      return newSelections;
    });
  };

  // Check section completion status when selections change
  useEffect(() => {
    if (questionData.length === 0) return;

    const newSectionCompletion = {};

    questionData.forEach((section) => {
      const sectionQuestionIds = section.questions.map((q) => q.question_id);

      // Debug log for questions in this section
      console.log(
        `Checking completion for section ${section.section_id}:`,
        sectionQuestionIds
      );
      console.log("Current selections:", selectedOptions);

      const isComplete = sectionQuestionIds.every((qId) => {
        // Explicitly check for existence of the question ID in the selections
        const hasAnswer = selectedOptions[qId] !== undefined;
        console.log(
          `Question ${qId}: ${hasAnswer ? "answered" : "not answered"}`
        );
        return hasAnswer;
      });

      console.log(`Section ${section.section_id} complete:`, isComplete);
      newSectionCompletion[section.section_id] = isComplete;
    });

    console.log("New section completion status:", newSectionCompletion);
    setSectionCompletion(newSectionCompletion);
  }, [selectedOptions, questionData]);

  const handleNextSection = () => {
    console.log("Current section complete:", currentSectionComplete);
    console.log("Current section:", currentSection);

    if (currentSectionIndex < questionData.length - 1) {
      setCurrentSectionIndex((prevIndex) => prevIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prevIndex) => prevIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  // When submitting, ensure we're formatting the data correctly
  const handleFinalSubmit = async () => {
    try {
      setLoading(true);

      // Format answers for the API - include both option ID and rating
      const finalAnswers = Object.entries(selectedOptions).map(
        ([questionId, optionId]) => {
          // Find the question and option to get the rating
          const question = questionData
            .flatMap((section) => section.questions)
            .find((q) => q.question_id === parseInt(questionId));

          const selectedOption = question?.options.find(
            (opt) => opt.option_id === optionId
          );

          return {
            question_id: parseInt(questionId),
            option_id: optionId,
            rating: selectedOption?.rating || 0,
          };
        }
      );

      // Prepare payload as expected by backend
      const roll_no = localStorage.getItem("roll_no");
      const sso_id = localStorage.getItem("sso_id");
      const exam_name = localStorage.getItem("exam_name");
      const session = localStorage.getItem("session");
      const payload = {
        roll_no,
        sso_id,
        exam_name,
        session,
        responses: finalAnswers,
      };
      const encrypted = encryptSectionData(
        payload,
        import.meta.env.VITE_SECRET_KEY
      );

      // Submit the encrypted data to the API
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/candidate/submit-responses`,
        { data: encrypted },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );


      localStorage.removeItem("roll_no");

      if (localStorage.getItem("roll_no")) localStorage.removeItem("sso_id");
      if (localStorage.getItem("name")) localStorage.removeItem("name");
      if (localStorage.getItem("exam_name")) localStorage.removeItem("exam_name");
      if (localStorage.getItem("session")) localStorage.removeItem("session");

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setError(`Failed to submit assessment: ${response.data.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Countdown and redirect after submission
  useEffect(() => {
    if (isSubmitted) {
      if (countdown === 0) {
        window.location.href = `http://${import.meta.env.VITE_API_BASE_URL}/ia24/Default.aspx`;
        return;
      }
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, countdown]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no questions are loaded, show a message
  if (questionData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 max-w-md text-center">
          <div className="text-yellow-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">
            No Questions Available
          </h2>
          <p className="text-gray-600 mb-4">
            The assessment questions could not be loaded. Please try again
            later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Current section data
  const currentSection = questionData[currentSectionIndex];
  const currentSectionComplete =
    sectionCompletion[currentSection?.section_id] || false;

  // Calculate progress percentage
  const completedSections =
    Object.values(sectionCompletion).filter(Boolean).length;
  const totalSections = questionData.length;
  const progressPercentage = Math.round(
    (completedSections / totalSections) * 100
  );

  return (
    <div className="py-8 px-4 md:px-8 font-sans">
      <div className="max-w-4xl mx-auto mt-10">
        
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-xl shadow text-center"
          >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Thank You!
            </h2>
            <p className="mb-6 text-gray-700">
              Your assessment has been submitted successfully.
            </p>
            <p className="mb-4 text-blue-600 font-semibold text-lg">
              Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
            </p>

            {/* <details className="text-left bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer text-blue-600 font-medium mb-2">
                View submission details
              </summary>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 text-gray-800">
                {JSON.stringify(selectedOptions, null, 2)}
              </pre>
            </details> */}
          </motion.div>
        ) : (
          <>
            {/* Improved Progress Bar */}
            <div className="mb-10">
              {/* Progress Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500">
                    Progress
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    Section {currentSectionIndex + 1} of {questionData.length}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {progressPercentage}%
                  </div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="relative mb-6">
                {/* Background Track */}
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        ((currentSectionIndex +
                          (currentSectionComplete ? 1 : 0)) /
                          questionData.length) *
                        100
                      }%`,
                    }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>

                {/* Step Indicators */}
                <div className="absolute -top-1 left-0 w-full flex justify-between">
                  {questionData.map((section, index) => {
                    const isCompleted =
                      index < currentSectionIndex ||
                      (index === currentSectionIndex && currentSectionComplete);
                    const isActive = index === currentSectionIndex;
                    const position = (index / (questionData.length - 1)) * 100;

                    return (
                      <motion.div
                        key={section.section_id}
                        className="absolute transform -translate-x-1/2"
                        style={{ left: `${position}%` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <motion.div
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-blue-600 border-blue-600 shadow-lg"
                              : isActive
                              ? "bg-white border-blue-600 shadow-md ring-4 ring-blue-100"
                              : "bg-white border-gray-300"
                          }`}
                          animate={{
                            scale: isActive ? [1, 1.2, 1] : 1,
                          }}
                          transition={{
                            repeat: isActive ? Infinity : 0,
                            duration: 2,
                          }}
                        >
                          {isCompleted && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <svg
                                className="w-2 h-2 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Section Names - Mobile Responsive */}
              <div className="hidden md:flex justify-between items-start mt-8 px-2">
                {questionData.map((section, index) => {
                  const isActive = index === currentSectionIndex;
                  return (
                    <div
                      key={section.section_id}
                      className={`flex-1 text-center px-2 ${
                        index === 0
                          ? "text-left"
                          : index === questionData.length - 1
                          ? "text-right"
                          : ""
                      }`}
                    >
                      <div
                        className={`text-xs font-medium transition-colors ${
                          isActive ? "text-blue-600" : "text-gray-500"
                        }`}
                      >
                        {section.section_name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Section Name */}
              <div className="md:hidden mt-6 text-center">
                <motion.div
                  key={currentSectionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-50 rounded-lg p-4"
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-1">
                    {currentSection.section_name}
                  </h3>
                  <p className="text-sm text-blue-600">
                    {currentSection.questions.length} question
                    {currentSection.questions.length !== 1 ? "s" : ""}
                    {currentSectionComplete && (
                      <span className="ml-2 inline-flex items-center">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="ml-1 text-green-600 font-medium">
                          Completed
                        </span>
                      </span>
                    )}
                  </p>
                </motion.div>
              </div>

              {/* Desktop Section Header */}
              <div className="hidden md:block mt-6 text-center">
                <motion.div
                  key={currentSectionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentSection.section_name}
                  </h2>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <span>
                      {currentSection.questions.length} question
                      {currentSection.questions.length !== 1 ? "s" : ""}
                    </span>
                    {currentSectionComplete && (
                      <span className="flex items-center text-green-600 font-medium">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Section Completed
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSectionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SectionContainer
                  section={currentSection}
                  onAnswerSelect={handleAnswerSelect}
                  selectedOptions={selectedOptions}
                />
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <motion.button
                onClick={handlePreviousSection}
                disabled={currentSectionIndex === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentSectionIndex > 0
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                whileHover={currentSectionIndex > 0 ? { scale: 1.03 } : {}}
                whileTap={currentSectionIndex > 0 ? { scale: 0.98 } : {}}
              >
                ← Previous
              </motion.button>

              {currentSectionIndex < questionData.length - 1 ? (
                <motion.button
                  onClick={handleNextSection}
                  disabled={!currentSectionComplete}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentSectionComplete
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-200 text-blue-400 cursor-not-allowed"
                  }`}
                  whileHover={currentSectionComplete ? { scale: 1.03 } : {}}
                  whileTap={currentSectionComplete ? { scale: 0.98 } : {}}
                >
                  {currentSectionComplete
                    ? "Next →"
                    : "Please answer all questions →"}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleFinalSubmit}
                  disabled={!currentSectionComplete}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    currentSectionComplete
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-200 text-green-400 cursor-not-allowed"
                  }`}
                  whileHover={currentSectionComplete ? { scale: 1.03 } : {}}
                  whileTap={currentSectionComplete ? { scale: 0.98 } : {}}
                >
                  Submit Assessment
                </motion.button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Assessment;
