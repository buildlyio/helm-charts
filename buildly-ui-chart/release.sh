#!/usr/bin/env bash
echo "Do you want to release a new version?"

select YES in yes no
do
    case $YES in
        "yes")
            echo Continuing
            break
            ;;
        *)
            echo Exit
            exit 0
            ;;
    esac
done

CURRENT_VERSION_OF_PACKAGE=$(helm local-chart-version get --chart .)

echo "Current version is $CURRENT_VERSION_OF_PACKAGE"
echo "Which version segment do you want?"

select VERSION_SEGMENT in major minor patch
do
    helm local-chart-version bump --chart . --version-segment $VERSION_SEGMENT
    break
done


NEW_VERSION_OF_PACKAGE=$(helm local-chart-version get --chart .)

echo "Do you want to commit it?"
git diff

COMMIT_MESSAGE="Bump version $NEW_VERSION_OF_PACKAGE"

echo "Commit message: $COMMIT_MESSAGE"

select YES in yes no
do
    case $YES in
        "yes")
            git commit -am "$COMMIT_MESSAGE"
            break
            ;;
        *)
            echo Continuing
            break
            ;;
    esac
done

helm dependency update

NEW_PACKAGE_TAR_BALL=$(helm package . | sed 's/^.*: //')

echo "Do you want to push new package to s3 $NEW_PACKAGE_TAR_BALL"

select YES in yes no
do
    case $YES in
        "yes")
            helm s3 push $NEW_PACKAGE_TAR_BALL humanitec-charts
            break
            ;;
        *)
            echo Exit
            exit 0
            ;;
    esac
done
