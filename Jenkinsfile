/* Requires the Docker Pipeline plugin */
pipeline {
    agent { docker { image 'node:node:18.15.0' } }
    stages {
        stage('build') {
            steps {
                sh 'node --version'
            }
        }
    }
}
