> [!NOTE]  
> This is a basic web app made for [Tarken](https://tarken.ag) Extension platform.


### Preview

<details>
  <summary>Extension demo</summary>
  
[demo.webm](https://github.com/micalevisk/tarken-extension-simple-react-example/assets/13461315/1ed31347-583b-4c54-a4cf-fd633dfae9c7)
  
</details>

---

### Install and get ready with TEx CLI

```bash
npm install --global @tarkenag/tex-cli@latest
tex login
```

If this extension did not exists yet, you can initialize this project with the offline mode:

```bash
tex init --offline
```

Otherwise use the usual: `tex init`

### Extension development

```bash
npm ci
npm run dev
```

To test this locally, navigate to  
`http://localhost:7801/?tex__organizationId={organization_ID}&ticket_to_use={credit_request_ID}`

Note that the values for `tex__organizationId` and `ticket_to_use` query parameters are up to you to find at https://hub.tarken.ag

## Create and publish this extension

```bash
tex create
tex deploy
```
