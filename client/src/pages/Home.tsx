import { useContext, useEffect, useState } from "react";

// components
import { ConfirmationModal, PageContainer, PageFooter } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

// const defaultDroppedAsset = { id: null, dataObject: {} };

const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // const [droppedAsset, setDroppedAsset] = useState(defaultDroppedAsset);
  const [scenes, setScenes] = useState<{ id: string; name: string; description: string; previewImgUrl: string }[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    if (hasSetupBackend) {
      backendAPI
        .get("/game-state")
        .then((response) => {
          setIsAdmin(response.data.isAdmin);
          setScenes(response.data.scenes);
          setSelectedSceneId(response.data.selectedSceneId);
        })
        .catch((error) => setErrorMessage(dispatch, error))
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hasSetupBackend]);

  const replaceScene = () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post("/replace-scene", { selectedSceneId })
      .then(() => {})
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  if (!hasSetupBackend) return <div />;

  return (
    <>
      {showConfirmationModal && (
        <ConfirmationModal handleToggleShowConfirmationModal={() => setShowConfirmationModal(!showConfirmationModal)} />
      )}

      <PageContainer isLoading={isLoading}>
        <>
          <h1 className="h2">Scene Swapper</h1>
          <p>Description TBD</p>

          {isAdmin && (
            <div className="mt-4">
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
            </div>
          )}

          <PageFooter>
            <button className="btn mb-2" disabled={areButtonsDisabled || !selectedSceneId} onClick={replaceScene}>
              Update Scene
            </button>
            <button
              className="btn btn-danger"
              disabled={areButtonsDisabled}
              onClick={() => setShowConfirmationModal(true)}
            >
              Clear Current Scene
            </button>
          </PageFooter>
        </>
      </PageContainer>
    </>
  );
};

export default Home;
