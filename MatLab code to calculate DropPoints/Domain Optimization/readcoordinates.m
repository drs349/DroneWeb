function v=readcoordinates(file)
%file='Polygon.txt';
str=sprintf('%s\n','					<coordinates>');

fid=fopen(file);
fseek(fid, 0, 'bof');

s=0;
n=0;
while s==0
    line=fgets(fid);
    if strcmp(line,str)
        s=1;
        v=fgets(fid);
    end
    n=n+1;
    if n==1e3
        break
    end
end 

v=str2num(v);
v=v';
v=reshape(v,3,length(v)/3);
v=v(1:2,:)';