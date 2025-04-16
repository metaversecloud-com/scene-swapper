/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useState } from "react";

// context
import { GlobalDispatchContext } from "@context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const ConfirmationModal = ({
  handleToggleShowConfirmationModal,
}: {
  handleToggleShowConfirmationModal: () => void;
}) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const handleReset = () => {
    setAreButtonsDisabled(true);

    backendAPI
      .post("/remove-scene")
      .then(() => {})
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
        handleToggleShowConfirmationModal();
      });
  };

  return (
    <div className="modal-container" style={{ maxHeight: "100vh" }}>
      <div className="modal">
        <h4>Remove Scene</h4>
        <p>Are you sure?</p>
        <div className="actions">
          <button
            id="close"
            className="btn btn-outline"
            onClick={() => handleToggleShowConfirmationModal()}
            disabled={areButtonsDisabled}
          >
            No
          </button>
          <button className="btn btn-danger-outline" onClick={() => handleReset()} disabled={areButtonsDisabled}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
