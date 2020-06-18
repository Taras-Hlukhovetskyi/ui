## Production

### `npm run docker`

Builds a production Docker image.

You can pass the following environment variables to control the resulting image name:

| Name  | Description | Default | Example |
| ----- | ----------- | ------- | ------- |
| MLRUN_DOCKER_REGISTRY | sets the Docker registy | (Dockerhub) | `quay.io/` |
| MLRUN_DOCKER_REPO | sets the Docker repository | `mlrun` | `iguazio` |
| MLRUN_DOCKER_TAG | sets the Docker image tag | `0.4.9`, `unstable` | `latest` |

Note: the trailing forward-slash `/` in `MLRUN_DOCKER_REGISTRY`'s value is significant.

Examples:

- Command: `npm run docker`<br />
  Resulting Docker image name: `mlrun/mlrun-ui:latest`
- Command: `MLRUN_DOCKER_REGISTRY=quay.io/ MLRUN_DOCKER_REPO=iguazio MLRUN_DOCKER_TAG=0.4.9 npm run docker`<br />
  Resulting Docker image name: `quay.io/iguazio/mlrun-ui:0.4.9`

### `docker run` environment variables

The Docker image runs an Nginx server, which listens on exposed port number 80 and serves the web-app.
You can pass the following environment variables on running the Docker image:

- `MLRUN_API_PROXY_URL`<br />
  Sets the base URL of the backend API<br />
  Example: `http://17.220.101.245:30080`<br />
  Default: `http://localhost:80`
- `MLRUN_V3IO_ACCESS_KEY`<br />
  Sets the V3IO access key to use for accessing V3IO containers<br />
  Example: `a7097c94-6e8f-436d-9717-a84abe2861d1`<br />
- `MLRUN_FUNCTION_CATALOG_URL`<br />
  Sets the base URL of the function-template catalog<br />
  Default: `https://raw.githubusercontent.com/mlrun/functions/master`

Example:

```
docker run -it -d -p 4000:80 --rm --name mlrun-ui -e MLRUN_API_PROXY_URL=http://17.220.101.245:30080 -e MLRUN_FUNCTION_CATALOG_URL=https://raw.githubusercontent.com/mlrun/functions/master -e MLRUN_V3IO_ACCESS_KEY=a7097c94-6e8f-436d-9717-a84abe2861d1 quay.io/mlrun/mlrun-ui:0.4.9
```

### Docker image contents

The files served by Nginx server are located at `/usr/share/nginx/html` and consist of:

- The production deployment files coming from the `build` folder (created by the [`npm run build`](#npm-run-build) command in the Dockerflie).
- `BUILD_DATE`: a file that contains the timestamp of running the `npm run docker` command, for example `Wed Jun 17 15:43:16 UTC 2020`.<br />
  In case the Docker container is running, you can use the following command to print the build date:
  ```
  $ docker exec -ti mlrun-ui sh -c "cat /usr/share/nginx/html/BUILD_DATE"
  Wed Jun 17 15:43:16 UTC 2020
  ```
- `COMMIT_HASH`: a file that contains the short git hash, for example: `703a554`.<br />
  In case the Docker container is running, you can use the following command to print the build date:
  ```
  $ docker exec -ti mlrun-ui sh -c "cat /usr/share/nginx/html/COMMIT_HASH"
  703a554
  ```

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed.

This command is run by the Dockerfile that is used by the command `npm run docker`.

Note: `npm install` should be run first.

## Development

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

Note: `npm install` should be run first.