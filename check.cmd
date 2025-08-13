for branch in $(git branch -r | grep -v '\->'); do
  echo "Checking $branch..."
  if git log "$branch" --author="Jeff Benson" -n 1 --pretty=format:"%h %s" | grep .; then
    echo "??  You have commits in $branch"
  fi
done
