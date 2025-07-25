import { useContext, useEffect, useState } from "react";

// components
import { ConfirmationModal, PageContainer, PageFooter } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";
import { getFact } from "../utils/getFact";

const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canSwapScenes, setCanSwapScenes] = useState<boolean>(false);
  const [scenes, setScenes] = useState<{ id: string; name: string; description: string; previewImgUrl: string }[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [title, setTitle] = useState<string>("Scene Swapper");
  const [description, setDescription] = useState<string>("");
  const [allowNonAdmins, setAllowNonAdmins] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false);

  useEffect(() => {
    if (hasSetupBackend) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          updateGameState(response.data);
        })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasSetupBackend]);

  const updateGameState = (data: {
    allowNonAdmins: boolean;
    isAdmin: boolean;
    lastSwappedDate?: Date;
    scenes: [];
    selectedSceneId: string;
    title?: string;
    description?: string;
  }) => {
    const { allowNonAdmins, isAdmin, lastSwappedDate, scenes, selectedSceneId, title, description } = data;
    setIsAdmin(isAdmin);
    setScenes(scenes);
    setSelectedSceneId(selectedSceneId);
    if (title) setTitle(title);
    if (description) setDescription(description);
    if (!isAdmin && lastSwappedDate) {
      const lastSwappedDateObj = new Date(lastSwappedDate);
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - lastSwappedDateObj.getTime();
      const minutesDifference = Math.floor(timeDifference / (1000 * 60));
      if (minutesDifference >= 30) {
        setCanSwapScenes(true);
        setMessage("");
      } else {
        setCanSwapScenes(false);
        setMessage(`Scene recently swapped. Please wait ${30 - minutesDifference} minutes before swapping again.`);
      }
    } else {
      setCanSwapScenes(true);
    }
    setAllowNonAdmins(allowNonAdmins);
  };

  const replaceScene = () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post("/replace-scene", { selectedSceneId })
      .then((response) => {
        updateGameState(response.data);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const updateAllowNonAdmins = (value: boolean) => {
    setAllowNonAdmins(value);
    backendAPI
      .post("/allow-non-admins", { allowNonAdmins: value })
      .then(() => {})
      .catch((error) => setErrorMessage(dispatch, error));
  };

  if (!hasSetupBackend) return <div />;

  return (
    <>
      {showConfirmationModal && (
        <ConfirmationModal handleToggleShowConfirmationModal={() => setShowConfirmationModal(!showConfirmationModal)} />
      )}

      <PageContainer isLoading={isLoading}>
        <>
          {isAdmin || allowNonAdmins ? (
            <>
              {title && <h1 className="h2">{title}</h1>}
              {description && <p>{description}</p>}
              <div className="mt-4 mb-10">
                {scenes?.map((scene) => (
                  <div key={scene.id} className="mb-2" onClick={() => setSelectedSceneId(scene.id)}>
                    <div className={`card small ${selectedSceneId === scene.id ? "success" : ""}`}>
                      <div className="card-image" style={{ height: "auto" }}>
                        <img src={scene.previewImgUrl} alt={scene.name} />
                      </div>
                      <div className="card-details">
                        <h4 className="card-title h4">{scene.name}</h4>
                        <p className="card-details">{scene.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {message && <p className="text-danger py-4">{message}</p>}
              </div>

              <PageFooter>
                {isAdmin && (
                  <label className="label text-center mb-4">
                    <input
                      checked={allowNonAdmins}
                      className="input-checkbox mr-2"
                      type="checkbox"
                      onChange={(event) => updateAllowNonAdmins(event.target.checked)}
                    />
                    Allow all users to swap scenes?
                  </label>
                )}
                <button
                  className="btn mb-2"
                  disabled={areButtonsDisabled || !selectedSceneId || !canSwapScenes}
                  onClick={replaceScene}
                >
                  Update Scene
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-danger"
                    disabled={areButtonsDisabled}
                    onClick={() => setShowConfirmationModal(true)}
                  >
                    Clear Current Scene
                  </button>
                )}
              </PageFooter>
            </>
          ) : (
            <div className="m-6 text-center">
              <div style={{ fontSize: 60 }}>🔮</div>
              {getFact()}
            </div>
          )}
        </>
      </PageContainer>
    </>
  );
};

export default Home;
