import { useEffect, useState } from "react";
import "./App.css";
import * as msal from "@azure/msal-browser";
import axios from "axios";

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID, // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    authority: import.meta.env.VITE_AUTHORITY,
  },
};

const msalInstance: msal.PublicClientApplication =
  new msal.PublicClientApplication(msalConfig);

function App() {
  const [count, setCount] = useState(0);
  const [popupToken, setPopupToken] = useState("");
  const [redirectToken, setRedirectToken] = useState<string | undefined>();

  const [apiCallInfo, setApiCallInfo] = useState({
    url: "",
    method: "",
    body: "",
    response: "",
    token: "",
  });

  const handlePopUp = async () => {
    await msalInstance.initialize();

    msalInstance
      .acquireTokenPopup({
        scopes: ["User.read"],
      })
      .then((response) => {
        setPopupToken(response.accessToken);
        setCount(count + 1);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleRedirect = async () => {
    msalInstance
      .acquireTokenRedirect({
        scopes: ["User.read"],
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    console.log("useEffect");
    msalInstance.initialize().then(() => {
      msalInstance
        .handleRedirectPromise()
        .then((response) => {
          if (!response) return;
          setRedirectToken(response.accessToken);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }, []);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={handlePopUp}>PopUp</button>
          <input
            type="text"
            readOnly
            value={popupToken}
            placeholder="Token do popup"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={handleRedirect}>Redirect</button>
          <input
            type="text"
            readOnly
            value={redirectToken}
            placeholder="Token do redirect"
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
            }}
          >
            <select
              onChange={(e) =>
                setApiCallInfo({ ...apiCallInfo, method: e.target.value })
              }
            >
              <option hidden>Method</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              onChange={(e) =>
                setApiCallInfo({ ...apiCallInfo, token: e.target.value })
              }
            >
              <option hidden>Token</option>
              <option value={popupToken}>Popup</option>
              <option value={redirectToken}>Redirect</option>
            </select>
          </div>

          <button
            disabled={
              !apiCallInfo.url || !apiCallInfo.method || !apiCallInfo.token
            }
            onClick={() => {
              axios(apiCallInfo.url, {
                method: apiCallInfo.method,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${popupToken}`,
                },
                data: apiCallInfo.body,
              }).then((response) => {
                console.log(response.data);
              });
            }}
          >
            Chamar
          </button>
        </div>
        <input
          type="text"
          placeholder="Rota"
          style={{ width: "100%", height: "32px" }}
          value={apiCallInfo.url}
          onChange={(e) =>
            setApiCallInfo({ ...apiCallInfo, url: e.target.value })
          }
        />
        <textarea
          style={{ width: "100%" }}
          readOnly
          placeholder="Resposta"
          value={apiCallInfo.response}
        />
      </div>
      <button
        onClick={async () => {
          await msalInstance.initialize();
          try {
            await msalInstance.handleRedirectPromise();
            await msalInstance.logoutPopup();
          } catch (error) {
            console.error(error);
          }
        }}
      >
        SignOut
      </button>
    </>
  );
}

export default App;
