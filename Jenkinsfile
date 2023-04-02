pipeline {

  agent any

  environment {
      REPO="chadwpalm"
      IMAGE_NAME="hueplex"
  }

  options {
      timeout (time: 10, unit: 'MINUTES')
      buildDiscarder (logRotator (numToKeepStr: '3'))
  }

  stages { 
    stage('Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: '71aeb696-0670-4267-8db4-8ee74774e051', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {              
          sh ('echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin')
        }
      }
    }
    stage('Build Dev') {
      when {
        branch "develop"
      }
      steps {
        script {
          def JSONVersion = readJSON file: "version.json"
          def PulledVersion = JSONVersion.version
          def APPVersion = "${PulledVersion}.${BUILD_ID}"
          sh "docker build --force-rm --pull --build-arg VERSION=${APPVersion}-dev -t ${REPO}/${IMAGE_NAME}:develop-${APPVersion} ."
          sh "docker tag ${REPO}/${IMAGE_NAME}:develop-${APPVersion} ${REPO}/${IMAGE_NAME}:develop"
          sh "docker push --all-tags ${REPO}/${IMAGE_NAME}"
          sh "docker rmi ${REPO}/${IMAGE_NAME}:develop-${APPVersion}"
        }
        
      }
    }
    stage('Build Prod') {
      when {
        branch "main"
      }
      steps {
        script {
          def JSONVersion = readJSON file: "version.json"
          def PulledVersion = JSONVersion.version
          def APPVersion = "${PulledVersion}.${BUILD_ID}"
          sh "docker build --force-rm --pull --build-arg VERSION=${APPVersion} -t ${REPO}/${IMAGE_NAME}:${APPVersion} ."
          sh "docker tag ${REPO}/${IMAGE_NAME}:${APPVersion} ${REPO}/${IMAGE_NAME}:latest"
          sh "docker push --all-tags ${REPO}/${IMAGE_NAME}"
          sh "docker rmi ${REPO}/${IMAGE_NAME}:latest-${APPVersion}"
        }
      }
    }
  }
}
